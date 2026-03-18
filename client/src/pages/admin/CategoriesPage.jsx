import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/categories', { name, description });
      setName(''); setDescription('');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Categories</h2>
      </div>

      <div className="mb-6">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="px-3 py-2 border rounded mr-2" />
        <input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" className="px-3 py-2 border rounded mr-2" />
        <Button onClick={handleCreate}>Create</Button>
      </div>

      <div>
        {loading ? <p>Loading…</p> : (
          <ul className="space-y-2">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between border px-3 py-2 rounded">
                <div>
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-sm text-muted-foreground">{cat.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(cat.slug)}>Copy Slug</Button>
                  <Button variant="destructive" onClick={() => handleDelete(cat.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
