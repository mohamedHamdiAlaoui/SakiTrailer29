import { Link } from 'react-router-dom';
import { useProductStore } from '@/context/ProductStoreContext';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';

export default function Products() {
  const { products } = useProductStore();
  const featuredProducts = products.slice(0, 4);

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">Featured stock</p>
            <h2 className="mt-2 text-4xl font-bold text-slate-950">Recently added vehicles</h2>
          </div>
          <Link to="/stock/new">
            <Button variant="outline">Browse all products</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
