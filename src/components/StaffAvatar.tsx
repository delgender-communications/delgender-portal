import { initials } from "../utils/format";

interface Props {
  name?: string | null;
  surname?: string | null;
  fullName?: string | null;
  profilePictureUrl?: string | null;
  size?: number;
}

function initialsFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export default function StaffAvatar({
  name,
  surname,
  fullName,
  profilePictureUrl,
  size = 30,
}: Props) {
  const fallback =
    name && surname
      ? initials(name, surname)
      : fullName
        ? initialsFromFullName(fullName)
        : "?";

  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {profilePictureUrl ? <img src={profilePictureUrl} alt="" /> : fallback}
    </div>
  );
}
