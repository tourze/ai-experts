## 代码模式

```php
<?php
// config/process.php
return ['ws' => ['handler' => App\Ws\Server::class, 'listen' => 'websocket://0.0.0.0:8001', 'reloadable' => false]];
```
