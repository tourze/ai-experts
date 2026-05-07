## 代码模式

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

final class UploadInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('upload', Invoice::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'invoice' => ['required', 'file', 'mimetypes:application/pdf', 'max:5120'],
        ];
    }
}
```

```php
<?php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('login', function (Request $request): array {
    return [
        Limit::perMinute(5)->by((string) $request->ip()),
        Limit::perMinute(5)->by(strtolower((string) $request->input('email'))),
    ];
});
```
