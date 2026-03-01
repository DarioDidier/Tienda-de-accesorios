import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  ChevronRight,
  Download,
  Menu,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Category, Product, CartItem, Sale } from './types';
import { cn, formatCurrency } from './utils';

// --- Components ---

const FlowerIcon = ({ className, color }: { className?: string, color: string }) => (
  <svg viewBox="0 0 24 24" className={cn("w-4 h-4", className)} fill={color}>
    <path d="M12,2L13.5,8.5L20,10L14.5,13.5L16,20L12,16.5L8,20L9.5,13.5L4,10L10.5,8.5L12,2Z" />
  </svg>
);

const Logo = ({ className }: { className?: string }) => (
  <div className={cn("relative flex flex-col items-center justify-center p-2", className)}>
    {/* Scattered Flowers */}
    <FlowerIcon color="#F5C542" className="absolute -top-1 -right-2 w-3 h-3 opacity-80" />
    <FlowerIcon color="#D1C4E9" className="absolute top-4 -left-3 w-2 h-2 opacity-60" />
    <FlowerIcon color="#F5C542" className="absolute bottom-2 -left-4 w-4 h-4 opacity-70" />
    <FlowerIcon color="#E88AB4" className="absolute -bottom-1 right-0 w-3 h-3 opacity-80" />
    <FlowerIcon color="#D1C4E9" className="absolute bottom-6 right-4 w-2 h-2 opacity-50" />
    
    <div className="flex flex-col items-center leading-none">
      <span className="font-sans text-2xl font-bold tracking-tight text-brand-pink-text">
        Accesorios
      </span>
      <span className="font-sans text-2xl font-bold tracking-tight text-brand-yellow-text -mt-1">
        Mirylou
      </span>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<'shop' | 'admin' | 'reports'>('shop');
  // --- Data Management (Client-side only for GitHub Pages) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Sale | null>(null);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('mirylou_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    // Initialize Data from localStorage or Defaults
    const savedProducts = localStorage.getItem('mirylou_products');
    const savedCategories = localStorage.getItem('mirylou_categories');
    const savedSales = localStorage.getItem('mirylou_sales');

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      const initialCats = [
        { id: 1, name: "Relojes" },
        { id: 2, name: "Anillos" },
        { id: 3, name: "Bijouterie" },
        { id: 4, name: "Cartucheras" },
        { id: 5, name: "Pulseras" },
        { id: 6, name: "Aritos" }
      ];
      setCategories(initialCats);
      localStorage.setItem('mirylou_categories', JSON.stringify(initialCats));
    }

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      const initialProducts = [
        { id: 1, name: "Reloj Rose Gold", price: 15500, category_id: 1, image_url: "https://images.unsplash.com/photo-1524333892444-2103734a1092?auto=format&fit=crop&q=80&w=400", description: "Reloj elegante con malla de acero inoxidable." },
        { id: 2, name: "Anillo Diamante", price: 8900, category_id: 2, image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400", description: "Anillo de plata con piedra brillante." },
        { id: 3, name: "Pulsera Perlas", price: 4500, category_id: 5, image_url: "https://images.unsplash.com/photo-1573408302185-9127fe5a9200?auto=format&fit=crop&q=80&w=400", description: "Pulsera delicada con perlas cultivadas." },
        { id: 4, name: "Aritos Colgantes", price: 3200, category_id: 6, image_url: "https://images.unsplash.com/photo-1535633302713-1026115e9209?auto=format&fit=crop&q=80&w=400", description: "Aritos modernos para cualquier ocasión." }
      ];
      setProducts(initialProducts);
      localStorage.setItem('mirylou_products', JSON.stringify(initialProducts));
    }

    if (savedSales) setSales(JSON.parse(savedSales));

    const savedCart = localStorage.getItem('mirylou_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const refreshData = () => {
    const p = JSON.parse(localStorage.getItem('mirylou_products') || '[]');
    const c = JSON.parse(localStorage.getItem('mirylou_categories') || '[]');
    const s = JSON.parse(localStorage.getItem('mirylou_sales') || '[]');
    setProducts(p);
    setCategories(c);
    setSales(s);
  };

  // Helper to get category name
  const productsWithCategory = useMemo(() => {
    return products.map(p => ({
      ...p,
      category_name: categories.find(c => c.id === p.category_id)?.name || 'Sin categoría'
    }));
  }, [products, categories]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return productsWithCategory.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [productsWithCategory, searchQuery, selectedCategory]);

  // Checkout
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    const invoiceNumber = `INV-${Date.now()}`;
    const newSale: Sale = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      date: new Date().toISOString(),
      total: cartTotal,
      items: cart
    };

    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem('mirylou_sales', JSON.stringify(updatedSales));
    
    setLastInvoice(newSale);
    setCart([]);
    setIsCheckingOut(false);
  };

  const downloadInvoice = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Factura-${lastInvoice?.invoice_number}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-brand-pink-text/20 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => setView('shop')} className="hover:opacity-80 transition-opacity">
            <Logo />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setView('shop')}
              className={cn("text-sm font-medium transition-colors", view === 'shop' ? "text-brand-accent" : "text-slate-500 hover:text-brand-accent")}
            >
              Tienda
            </button>
            <button 
              onClick={() => setView('admin')}
              className={cn("text-sm font-medium transition-colors", view === 'admin' ? "text-brand-accent" : "text-slate-500 hover:text-brand-accent")}
            >
              Administrar
            </button>
            <button 
              onClick={() => setView('reports')}
              className={cn("text-sm font-medium transition-colors", view === 'reports' ? "text-brand-accent" : "text-slate-500 hover:text-brand-accent")}
            >
              Reportes
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-brand-pink hover:bg-brand-pink-text/30 transition-colors text-brand-accent"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-50 bg-white p-6 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <Logo />
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex flex-col gap-4 text-lg font-medium">
              <button onClick={() => { setView('shop'); setIsMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-100">Tienda</button>
              <button onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-100">Administrar</button>
              <button onClick={() => { setView('reports'); setIsMobileMenuOpen(false); }} className="text-left py-2 border-b border-slate-100">Reportes</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {view === 'shop' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1515562141207-7a18b5ce7142?auto=format&fit=crop&q=80&w=1920" 
                className="w-full h-full object-cover"
                alt="Hero"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/40 to-transparent flex flex-col justify-center p-8 md:p-12">
                <h2 className="text-3xl md:text-5xl text-white font-serif italic mb-2">Elegancia en cada detalle</h2>
                <p className="text-white/90 max-w-md">Descubre nuestra colección exclusiva de accesorios diseñados para resaltar tu brillo natural.</p>
              </div>
            </section>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar accesorios..." 
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-brand-pink-text/30 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    selectedCategory === null ? "bg-brand-accent text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-brand-accent/30"
                  )}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      selectedCategory === cat.id ? "bg-brand-accent text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-brand-accent/30"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {filteredProducts.map(product => (
                <motion.div 
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1535633302713-1026115e9209?auto=format&fit=crop&q=80&w=400'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand-accent shadow-sm">
                        {product.category_name}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-lg mb-1 truncate">{product.name}</h3>
                    <p className="text-slate-500 text-xs mb-3 line-clamp-1">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-accent">{formatCurrency(product.price)}</span>
                      <button 
                        onClick={() => addToCart(product)}
                        className="p-2 bg-brand-pink text-brand-accent rounded-full hover:bg-brand-accent hover:text-white transition-all shadow-sm"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex p-6 bg-brand-pink rounded-full text-brand-accent mb-4">
                  <Search size={48} />
                </div>
                <h3 className="text-xl font-serif">No encontramos productos</h3>
                <p className="text-slate-500">Intenta con otra búsqueda o categoría.</p>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && <AdminPanel products={productsWithCategory} categories={categories} onRefresh={refreshData} />}
        {view === 'reports' && <ReportsPanel sales={sales} products={productsWithCategory} />}
      </main>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-serif italic flex items-center gap-2">
                  <ShoppingBag className="text-brand-accent" /> Mi Carrito
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-8 bg-brand-pink rounded-full text-brand-accent">
                      <ShoppingBag size={64} />
                    </div>
                    <h3 className="text-xl font-serif">Tu carrito está vacío</h3>
                    <p className="text-slate-500">¡Explora nuestra tienda y encuentra algo especial!</p>
                    <button 
                      onClick={() => { setIsCartOpen(false); setView('shop'); }}
                      className="btn-primary"
                    >
                      Ver productos
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-lg truncate">{item.name}</h4>
                        <p className="text-brand-accent font-bold mb-2">{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-slate-200 rounded-full px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-brand-accent"><Minus size={14} /></button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-brand-accent"><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-2xl text-brand-accent">{formatCurrency(cartTotal)}</span>
                  </div>
                  <button 
                    disabled={isCheckingOut}
                    onClick={handleCheckout}
                    className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? 'Procesando...' : 'Finalizar Compra'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {lastInvoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLastInvoice(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b flex justify-between items-center bg-brand-pink/30">
                <h3 className="font-serif text-xl italic">¡Gracias por tu compra!</h3>
                <button onClick={() => setLastInvoice(null)} className="p-2 hover:bg-white rounded-full"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8" id="invoice-content">
                <div className="flex justify-between items-start mb-8">
                  <Logo />
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-slate-800">FACTURA</h2>
                    <p className="text-slate-500">#{lastInvoice.invoice_number}</p>
                    <p className="text-slate-500">{format(new Date(lastInvoice.date), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                  </div>
                </div>

                <div className="border-t border-b border-slate-100 py-6 mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-4">Producto</th>
                        <th className="pb-4 text-center">Cant.</th>
                        <th className="pb-4 text-right">Precio</th>
                        <th className="pb-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lastInvoice.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-4 font-medium">{item.name}</td>
                          <td className="py-4 text-center">{item.quantity}</td>
                          <td className="py-4 text-right">{formatCurrency(item.price)}</td>
                          <td className="py-4 text-right font-bold">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(lastInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-brand-accent pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(lastInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                  <p>Gracias por elegir Accesorios Mirylou</p>
                  <p>www.accesoriosmirylou.com</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex gap-4">
                <button 
                  onClick={downloadInvoice}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Download size={20} /> Descargar PDF
                </button>
                <button 
                  onClick={() => setLastInvoice(null)}
                  className="flex-1 btn-primary"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-pink-text/20 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-slate-500 text-sm">Tu destino favorito para accesorios que cuentan historias. Calidad, estilo y elegancia en un solo lugar.</p>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {categories.slice(0, 5).map(c => <li key={c.id} className="hover:text-brand-accent cursor-pointer">{c.name}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="hover:text-brand-accent cursor-pointer">Sobre Nosotros</li>
              <li className="hover:text-brand-accent cursor-pointer">Contacto</li>
              <li className="hover:text-brand-accent cursor-pointer">Términos y Condiciones</li>
              <li className="hover:text-brand-accent cursor-pointer">Preguntas Frecuentes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-4">Newsletter</h4>
            <p className="text-sm text-slate-500 mb-4">Suscríbete para recibir ofertas exclusivas.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Tu email" className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
              <button className="p-2 bg-brand-accent text-white rounded-full"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} Accesorios Mirylou. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

// --- Admin Panel Component ---

function AdminPanel({ products, categories, onRefresh }: { products: Product[], categories: Category[], onRefresh: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    image_url: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentProducts = JSON.parse(localStorage.getItem('mirylou_products') || '[]');
    
    if (editingProduct) {
      const updated = currentProducts.map((p: Product) => 
        p.id === editingProduct.id ? { 
          ...p, 
          ...formData, 
          price: parseFloat(formData.price), 
          category_id: parseInt(formData.category_id) 
        } : p
      );
      localStorage.setItem('mirylou_products', JSON.stringify(updated));
    } else {
      const newProduct = {
        ...formData,
        id: Date.now(),
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id)
      };
      localStorage.setItem('mirylou_products', JSON.stringify([...currentProducts, newProduct]));
    }

    setIsAdding(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', category_id: '', image_url: '', description: '' });
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const currentProducts = JSON.parse(localStorage.getItem('mirylou_products') || '[]');
    const filtered = currentProducts.filter((p: Product) => p.id !== id);
    localStorage.setItem('mirylou_products', JSON.stringify(filtered));
    onRefresh();
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    const currentCats = JSON.parse(localStorage.getItem('mirylou_categories') || '[]');
    const newCat = { id: Date.now(), name: newCategory };
    localStorage.setItem('mirylou_categories', JSON.stringify([...currentCats, newCat]));
    setNewCategory('');
    onRefresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif italic">Panel de Administración</h2>
          <p className="text-slate-500">Gestiona tus productos y categorías.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Categories Manager */}
        <div className="lg:col-span-1 glass p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
            <Filter size={20} className="text-brand-accent" /> Categorías
          </h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Nueva categoría..." 
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button onClick={handleAddCategory} className="p-2 bg-brand-pink text-brand-accent rounded-xl hover:bg-brand-accent hover:text-white transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500">
                  {products.filter(p => p.category_id === cat.id).length} productos
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl shadow-sm overflow-x-auto">
          <h3 className="text-xl font-serif mb-4 flex items-center gap-2">
            <Package size={20} className="text-brand-accent" /> Inventario
          </h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="pb-4">Producto</th>
                <th className="pb-4">Categoría</th>
                <th className="pb-4">Precio</th>
                <th className="pb-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(product => (
                <tr key={product.id} className="group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image_url} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-sm">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs bg-brand-pink text-brand-accent px-2 py-1 rounded-full font-medium">
                      {product.category_name}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-sm">{formatCurrency(product.price)}</td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setFormData({
                            name: product.name,
                            price: product.price.toString(),
                            category_id: product.category_id.toString(),
                            image_url: product.image_url,
                            description: product.description
                          });
                          setIsAdding(true);
                        }}
                        className="p-2 text-slate-400 hover:text-brand-accent hover:bg-brand-pink rounded-lg transition-all"
                      >
                        <TrendingUp size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setIsAdding(false); setEditingProduct(null); }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-2xl font-serif mb-6">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Nombre</label>
                    <input 
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Precio</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Categoría</label>
                    <select 
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: e.target.value})}
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">URL Imagen</label>
                    <input 
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      value={formData.image_url}
                      onChange={e => setFormData({...formData, image_url: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Descripción</label>
                    <textarea 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingProduct(null); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 btn-primary py-3 font-bold"
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Reports Panel Component ---

function ReportsPanel({ sales, products }: { sales: Sale[], products: Product[] }) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const dailyTotal = sales
      .filter(s => s.date.startsWith(today))
      .reduce((sum, s) => sum + s.total, 0);

    const monthlyTotal = sales
      .filter(s => s.date.startsWith(thisMonth))
      .reduce((sum, s) => sum + s.total, 0);

    const productSales: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Chart Data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const total = sales
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0);
      return { date: format(d, 'dd MMM', { locale: es }), total };
    }).reverse();

    return { dailyTotal, monthlyTotal, topProducts, last7Days };
  }, [sales]);

  const COLORS = ['#DB2777', '#C4B5FD', '#F9A8D4', '#8B5CF6', '#F472B6'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif italic">Reportes de Ventas</h2>
          <p className="text-slate-500">Visualiza el rendimiento de tu negocio.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl shadow-sm border-l-4 border-brand-accent">
          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Ventas Hoy</p>
          <h3 className="text-3xl font-bold text-brand-accent">{formatCurrency(stats.dailyTotal)}</h3>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" /> Actualizado al instante
          </p>
        </div>
        <div className="glass p-6 rounded-3xl shadow-sm border-l-4 border-brand-lilac-text">
          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Ventas del Mes</p>
          <h3 className="text-3xl font-bold text-slate-800">{formatCurrency(stats.monthlyTotal)}</h3>
          <p className="text-xs text-slate-500 mt-2">Mes de {format(new Date(), 'MMMM', { locale: es })}</p>
        </div>
        <div className="glass p-6 rounded-3xl shadow-sm border-l-4 border-slate-200">
          <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total Pedidos</p>
          <h3 className="text-3xl font-bold text-slate-800">{sales.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Historial acumulado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="glass p-6 rounded-3xl shadow-sm">
          <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-accent" /> Ventas Últimos 7 Días
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#fdf2f8' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#DB2777" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass p-6 rounded-3xl shadow-sm">
          <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-accent" /> Productos Más Vendidos
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="qty"
                  >
                    {stats.topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold">{p.qty} u.</span>
                </div>
              ))}
              {stats.topProducts.length === 0 && <p className="text-slate-400 text-sm italic">Sin datos suficientes</p>}
            </div>
          </div>
        </div>

        {/* Sales History */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl shadow-sm overflow-x-auto">
          <h3 className="text-xl font-serif mb-6">Historial de Ventas</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="pb-4">Factura</th>
                <th className="pb-4">Fecha</th>
                <th className="pb-4">Items</th>
                <th className="pb-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-mono text-xs font-bold text-brand-accent">{sale.invoice_number}</td>
                  <td className="py-4 text-sm text-slate-600">{format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="py-4">
                    <div className="flex -space-x-2">
                      {sale.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm" title={item.name}>
                          <img src={item.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                      {sale.items.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          +{sale.items.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-right font-bold">{formatCurrency(sale.total)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 italic">No hay ventas registradas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
