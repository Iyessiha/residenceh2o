// Le contenu du blog n'est pas encore relu : on empêche son indexation.
export const metadata = {
  robots: { index: false, follow: false },
}

export default function BlogLayout({ children }) {
  return <>{children}</>;
}
