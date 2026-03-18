import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tags');
      setTags(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/tags', { name });
      setName('');
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tag');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await api.delete(`/tags/${id}`);
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tag');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Tags</h2>
      </div>

      <div className="mb-6">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="px-3 py-2 border rounded mr-2" />
        <Button onClick={handleCreate}>Create</Button>
      </div>

      <div>
        {loading ? <p>Loading…</p> : (
          <ul className="space-y-2">
            {tags.map(t => (
              <li key={t.id} className="flex items-center justify-between border px-3 py-2 rounded">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.slug}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(t.slug)}>Copy Slug</Button>
                  <Button variant="destructive" onClick={() => handleDelete(t.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
