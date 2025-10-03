import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function EditProfilePage() {
  const [form, setForm] = useState({
    username: "",
    image_url: "",
    contact_number: "",
    plan: "",
  });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getProfile().then(res => {
      if (res.ok) setForm(res.data);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.ok) {
      setMsg("Updated successfully!");
      setTimeout(() => navigate("/profile"), 1000);
    } else {
      setMsg(res.error || "Update failed");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 border rounded shadow space-y-3"
    >
      <h2 className="text-xl font-semibold text-center">Edit Profile</h2>

      <input
        className="border p-2 w-full rounded"
        value={form.username}
        onChange={e => setForm({ ...form, username: e.target.value })}
        placeholder="Username"
      />

      <input
        className="border p-2 w-full rounded"
        value={form.image_url}
        onChange={e => setForm({ ...form, image_url: e.target.value })}
        placeholder="Image URL"
      />

      <input
        className="border p-2 w-full rounded"
        value={form.contact_number}
        onChange={e => setForm({ ...form, contact_number: e.target.value })}
        placeholder="Contact Number"
      />

      <input
        className="border p-2 w-full rounded"
        value={form.plan}
        onChange={e => setForm({ ...form, plan: e.target.value })}
        placeholder="Plan"
      />

      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
        Save
      </button>

      {msg && <p className="text-center text-green-600 mt-2">{msg}</p>}
    </form>
  );
}
