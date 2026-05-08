# React Server Components 高级模式

## 使用 Suspense 的流式渲染

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { RevenueChart, LatestOrders, Stats } from './components';

export default function DashboardPage() {
  return (
    <div className="dashboard">
      {/* Stats 最先加载——快速查询 */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <div className="grid grid-cols-2 gap-4">
        {/* Chart 和 orders 独立流式加载 */}
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<OrdersSkeleton />}>
          <LatestOrders />
        </Suspense>
      </div>
    </div>
  );
}

// 每个组件自行获取数据
async function Stats() {
  const stats = await fetchStats(); // 100ms
  return <StatsDisplay stats={stats} />;
}

async function RevenueChart() {
  const revenue = await fetchRevenue(); // 500ms
  return <Chart data={revenue} />;
}

async function LatestOrders() {
  const orders = await fetchLatestOrders(); // 300ms
  return <OrderList orders={orders} />;
}
```

---

## 缓存策略

```tsx
// app/products/page.tsx
import { unstable_cache } from 'next/cache';

// 缓存数据库查询
const getProducts = unstable_cache(
  async (category: string) => {
    return db.product.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['products'],
  {
    revalidate: 60, // 每 60 秒重新验证
    tags: ['products'],
  }
);

export default async function ProductsPage({
  params,
}: {
  params: { category: string };
}) {
  const products = await getProducts(params.category);
  return <ProductGrid products={products} />;
}

// 从 Server Action 重新验证缓存
'use server';

import { revalidateTag } from 'next/cache';

export async function createProduct(formData: FormData) {
  await db.product.create({ ... });

  // 使 products 缓存失效
  revalidateTag('products');
}
```

### 路由段配置

```tsx
// 强制动态渲染
export const dynamic = 'force-dynamic';

// 强制静态渲染
export const dynamic = 'force-static';

// 重新验证间隔
export const revalidate = 60;

// 运行时
export const runtime = 'edge'; // 或 'nodejs'
```

---

## 模式

### 将服务端数据传递给客户端组件

```tsx
// ✅ 好：将数据作为 props 传递（可序列化）
async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id);
  return <AddToCartButton product={product} />;
}

// ❌ 不好：不能传递函数
async function ProductPage({ id }: { id: string }) {
  const addToCart = async () => { ... };
  // Error: Functions cannot be passed to Client Components
  return <AddToCartButton onAdd={addToCart} />;
}

// ✅ 好：改用 Server Actions
// actions.ts
'use server';
export async function addToCart(productId: string) { ... }

// components/add-to-cart.tsx
'use client';
import { addToCart } from '@/app/actions';

export function AddToCartButton({ productId }: { productId: string }) {
  return (
    <button onClick={() => addToCart(productId)}>
      Add to Cart
    </button>
  );
}
```

### 服务端与客户端组件的交错使用

```tsx
// Server Component
async function ProductList() {
  const products = await getProducts();

  return (
    <div>
      {products.map(product => (
        // Server Component 可以渲染 Client Component
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Client Component
'use client';

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{product.name}</h3>
    </div>
  );
}
```

### 客户端中使用服务端组件的 Children 模式

```tsx
// ✅ 模式：将 Server Components 作为 children 传递
'use client';

function ClientWrapper({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && children}  {/* Server Component 可在此工作！ */}
    </div>
  );
}

// 在 Server Component 中使用
async function Page() {
  const data = await fetchData();

  return (
    <ClientWrapper>
      <ServerComponent data={data} />
    </ClientWrapper>
  );
}
```

---

## 错误处理

```tsx
// app/products/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/products/loading.tsx
export default function Loading() {
  return <ProductsSkeleton />;
}

// app/products/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Product not found</h2>
      <Link href="/products">Back to products</Link>
    </div>
  );
}
```

---

## 并行与顺序数据获取

```tsx
// 顺序（较慢）——默认方式
async function Page() {
  const user = await getUser();      // 等待...
  const posts = await getPosts();    // 再等待...
  return <div>...</div>;
}

// 并行（更快）
async function Page() {
  // 同时启动两个请求
  const userPromise = getUser();
  const postsPromise = getPosts();

  // 等待两者完成
  const [user, posts] = await Promise.all([userPromise, postsPromise]);

  return <div>...</div>;
}

// 流式渲染（最佳用户体验）
async function Page() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <User />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
    </div>
  );
}

async function User() {
  const user = await getUser();
  return <UserProfile user={user} />;
}

async function Posts() {
  const posts = await getPosts();
  return <PostsList posts={posts} />;
}
```
