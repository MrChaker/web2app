export const durationPastFromDate = (date: string | number | Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);

  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""}`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
};

export const formatTimeStringToDate = (
  time: string | number | Date
): string | undefined => {
  if (!time) return;
  const date = new Date(time);
  const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${date.getFullYear()}`;
  return formattedDate;
};

export const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1048576) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1073741824) {
    return `${(size / 1048576).toFixed(2)} MB`;
  } else {
    return `${(size / 1073741824).toFixed(2)} GB`;
  }
};

export function getParentDirectory(path: string): string {
  let normalizedPath = path.replace(/\\/g, "/");

  normalizedPath = normalizedPath.replace(/\/+$/, "");

  let splits = normalizedPath.split("/");

  splits.pop();

  let parentPath = splits.join("/");
  if (navigator.platform.includes("Win")) {
    parentPath = parentPath.replace(/\//g, "\\");
  }

  return parentPath;
}

export const deactivateMachine = async (id: string, key: string) => {
  // get machine
  const res = await fetch(
    `https://api.keygen.sh/v1/accounts/${
      import.meta.env.VITE_KEYGEN_ACCOUNT_ID
    }/licenses/${id}/machines`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `License ${key}`,
      },
    }
  );
  const { data: machines } = await res.json();
  console.log(machines[0]);

  const deleteRes = await fetch(
    `https://api.keygen.sh/v1/accounts/${
      import.meta.env.VITE_KEYGEN_ACCOUNT_ID
    }/machines/${machines[0].id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `License ${key}`,
      },
    }
  );
  return deleteRes;
};
