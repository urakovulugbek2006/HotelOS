"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { menuApi } from "@/lib/api";
import type { MenuItemResponse } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { SkeletonRow } from "@/components/ui/LoadingSkeleton";

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Beverages", "Desserts", "Other"];

export default function ManagerMenuPage() {
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<MenuItemResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "Other",
  });

  const load = () => {
    setLoading(true);
    menuApi.getAll().then(setItems).catch(() => toast.error("Failed to load menu")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const item = await menuApi.addItem(form);
      setItems((prev) => [...prev, item]);
      toast.success("Menu item added");
      setAddModal(false);
      setForm({ name: "", description: "", price: 0, category: "Other" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setSaving(true);
    try {
      const updated = await menuApi.update(editModal.id, form);
      setItems((prev) => prev.map((i) => i.id === editModal.id ? updated : i));
      toast.success("Item updated");
      setEditModal(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: MenuItemResponse) => {
    setForm({ name: item.name, description: item.description, price: item.price, category: item.category });
    setEditModal(item);
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const updated = await menuApi.toggle(id);
      setItems((prev) => prev.map((i) => i.id === id ? updated : i));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setToggling(null);
    }
  };

  const grouped = CATEGORIES.reduce<Record<string, MenuItemResponse[]>>((acc, cat) => {
    acc[cat] = items.filter((i) => i.category === cat);
    return acc;
  }, {});
  const other = items.filter((i) => !CATEGORIES.includes(i.category));
  if (other.length > 0) grouped["Other"] = [...(grouped["Other"] ?? []), ...other];

  const MenuForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label>Name</label>
        <input value={form.name} onChange={set("name")} required />
      </div>
      <div>
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={2}
          className="bg-navy-700 border border-navy-600 text-white rounded-md px-3 py-2 w-full placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Price ($)</label>
          <input type="number" value={form.price} onChange={set("price")} min={0} step="0.01" required />
        </div>
        <div>
          <label>Category</label>
          <select value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" type="button" onClick={() => { setAddModal(false); setEditModal(null); }}>Cancel</Button>
        <Button type="submit" loading={saving}>Save</Button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Menu Management</h1>
        <Button onClick={() => { setForm({ name: "", description: "", price: 0, category: "Other" }); setAddModal(true); }}>
          + Add Item
        </Button>
      </div>

      {loading ? (
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <table className="w-full"><tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No menu items yet</div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const catItems = grouped[cat];
            if (!catItems || catItems.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{cat}</h2>
                <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-navy-900/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Description</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Price</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Available</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700">
                      {catItems.map((item) => (
                        <tr key={item.id} className={`hover:bg-navy-700/30 transition-colors ${!item.isAvailable ? "opacity-50" : ""}`}>
                          <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{item.description}</td>
                          <td className="px-4 py-3 text-gold-400">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge label={item.isAvailable ? "Available" : "Unavailable"} variant={item.isAvailable ? "green" : "gray"} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>Edit</Button>
                              <Button
                                size="sm"
                                variant={item.isAvailable ? "danger" : "primary"}
                                loading={toggling === item.id}
                                onClick={() => handleToggle(item.id)}
                              >
                                {item.isAvailable ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Menu Item">
        <MenuForm onSubmit={handleAdd} />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit — ${editModal?.name}`}>
        <MenuForm onSubmit={handleEdit} />
      </Modal>
    </div>
  );
}
