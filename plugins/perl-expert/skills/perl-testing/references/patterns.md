# Perl Testing 代码模式

## 单元测试（Test2::V0）

```perl
use v5.36;
use Test2::V0;

use App::UserService;

subtest 'create_user returns user with id' => sub {
    my $mock_dbh = mock_obj {} => (
        add => [
            prepare => sub {
                mock_obj {} => (
                    add => [
                        execute        => sub { 1 },
                        fetchrow_array => sub { (42) },
                    ],
                );
            },
        ],
    );

    my $service = App::UserService->new(db => $mock_dbh);
    my $user = $service->create_user(email => 'alice@example.com', name => 'Alice');

    is $user->{id}, 42, 'returns generated id';
    is $user->{email}, 'alice@example.com', 'returns email';
};

subtest 'create_user dies without email' => sub {
    my $mock_dbh = mock_obj {} => (add => []);
    my $service = App::UserService->new(db => $mock_dbh);

    like dies { $service->create_user(name => 'Bob') },
        qr/email is required/,
        'croak on missing email';
};

done_testing;
```

## 常用运行命令

```bash
carton exec -- prove -lr t/
carton exec -- prove -lr --jobs 4 t/
carton exec -- prove -lrv t/unit/user_service.t
```
