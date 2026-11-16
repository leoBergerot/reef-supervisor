import { useEffect, useState } from "react";
import { fetchTankPhoto } from "../api/client";

export function TankPhoto({ token, tank, className = "h-40 w-full bg-cyan-50 object-cover" }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!tank?.photo_url) {
      setSrc(null);
      return undefined;
    }
    let cancelled = false;
    let objectUrl = null;
    fetchTankPhoto(token, tank.photo_url)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, tank?.id, tank?.photo_url]);

  return (
    <img
      src={src || "/tank-placeholder.svg"}
      alt=""
      className={src ? className : `${className} object-contain p-[12%]`}
    />
  );
}
