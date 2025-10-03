import { useEffect, useState } from "react";
import { getProfile } from "../services/api";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then(res => {
      if (res.ok) setProfile(res.data);
    });
  }, []);

  if (!profile) return <p className="text-center p-4">Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow">
      <img
        src={profile.image_url || "/default.png"}
        alt="Profile"
        className="w-24 h-24 rounded-full mx-auto"
      />
      <h2 className="text-2xl font-semibold mt-3 text-center">{profile.username || "No username"}</h2>
      <p className="text-center text-gray-600">{profile.email}</p>
      <p className="text-center mt-2">Plan: {profile.plan}</p>
      <p className="text-center">Contact: {profile.contact_number || "N/A"}</p>

      <Link
        to="/edit-profile"
        className="block mt-4 text-blue-600 hover:underline text-center"
      >
        Edit Profile
      </Link>
    </div>
  );
}
