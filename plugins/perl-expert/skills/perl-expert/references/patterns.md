# Perl Expert 代码模式

## Service 模块

```perl
use v5.36;

package App::UserService;
use Moo;
use Types::Standard qw(InstanceOf);
use Carp qw(croak);

has db => (
    is       => 'ro',
    isa      => InstanceOf['DBI::db'],
    required => 1,
);

sub create_user ($self, %params) {
    croak 'email is required' unless $params{email};

    my $sth = $self->db->prepare(
        'INSERT INTO users (email, name) VALUES (?, ?) RETURNING id'
    );
    $sth->execute($params{email}, $params{name});
    my ($id) = $sth->fetchrow_array;

    return { id => $id, email => $params{email} };
}

1;
```

## CLI 入口

```perl
use v5.36;

use Getopt::Long qw(GetOptions);
use DBI;
use App::UserService;

GetOptions(
    'dsn=s'   => \my $dsn,
    'email=s' => \my $email,
    'name=s'  => \my $name,
) or die "Usage: $0 --dsn DBI:... --email ... --name ...\n";

my $dbh     = DBI->connect($dsn, undef, undef, { RaiseError => 1, AutoCommit => 1 });
my $service = App::UserService->new(db => $dbh);
my $user    = $service->create_user(email => $email, name => $name);

say "Created user $user->{id}: $user->{email}";
```

## 常用工作流命令

```bash
carton install
carton exec -- prove -lr t/
carton exec -- perlcritic --severity 3 lib/
carton exec -- perltidy -b lib/**/*.pm
```
