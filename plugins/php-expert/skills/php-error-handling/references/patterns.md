# PHP 错误处理 — 代码示例

## 分层异常体系

```php
<?php

declare(strict_types=1);

namespace App\Exception;

abstract class DomainException extends \RuntimeException {}

final class ValidationException extends DomainException
{
    /** @param array<string, list<string>> $errors */
    public function __construct(
        public readonly array $errors,
        string $message = 'Validation failed.',
    ) {
        parent::__construct($message);
    }
}

final class DuplicateEmailException extends DomainException
{
    public function __construct(string $email)
    {
        parent::__construct("Email already registered: {$email}");
    }
}

final class PaymentGatewayException extends DomainException
{
    public function __construct(string $gateway, ?\Throwable $previous = null)
    {
        parent::__construct("Payment gateway unavailable: {$gateway}", 0, $previous);
    }
}
```

## 边界处输入校验

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Exception\ValidationException;

final readonly class OrderValidator
{
    /**
     * @param array<string, mixed> $input
     * @throws ValidationException
     */
    public function validate(array $input): void
    {
        $errors = [];

        if (!isset($input['amount']) || !is_int($input['amount'])) {
            $errors['amount'][] = 'Amount must be an integer.';
        } elseif ($input['amount'] <= 0) {
            $errors['amount'][] = 'Amount must be positive.';
        }

        if (!isset($input['currency']) || !in_array($input['currency'], ['CNY', 'USD', 'EUR'], true)) {
            $errors['currency'][] = 'Unsupported currency.';
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }
    }
}
```

## 异常到 HTTP 响应的映射

```php
<?php

declare(strict_types=1);

namespace App\Http;

use App\Exception\DomainException;
use App\Exception\ValidationException;

final class ExceptionToResponseMapper
{
    public function map(\Throwable $e): array
    {
        return match (true) {
            $e instanceof ValidationException => [
                'status' => 422,
                'body' => ['error' => 'validation_error', 'details' => $e->errors],
            ],
            $e instanceof DomainException => [
                'status' => 409,
                'body' => ['error' => 'business_error', 'message' => $e->getMessage()],
            ],
            default => [
                'status' => 500,
                'body' => ['error' => 'internal_error', 'message' => 'An unexpected error occurred.'],
            ],
        };
    }
}
```

## 批量处理的部分失败

```php
<?php

declare(strict_types=1);

namespace App\Service;

final readonly class BatchImporter
{
    /**
     * @param list<array<string, mixed>> $rows
     * @return array{imported: int, failed: list<array{row: int, reason: string}>}
     */
    public function import(array $rows): array
    {
        $imported = 0;
        $failed = [];

        foreach ($rows as $index => $row) {
            try {
                $this->importSingleRow($row);
                $imported++;
            } catch (\Throwable $e) {
                $failed[] = ['row' => $index, 'reason' => $e->getMessage()];
            }
        }

        return ['imported' => $imported, 'failed' => $failed];
    }
}
```

## 外部依赖的 try/catch 边界

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure;

use App\Exception\PaymentGatewayException;

final readonly class StripePaymentClient
{
    public function charge(int $amountInCents, string $currency): string
    {
        try {
            $response = $this->httpClient->post('/charges', [
                'amount' => $amountInCents,
                'currency' => $currency,
            ]);
            return $response['charge_id'];
        } catch (\Throwable $e) {
            throw new PaymentGatewayException('stripe', $e);
        }
    }
}
```
