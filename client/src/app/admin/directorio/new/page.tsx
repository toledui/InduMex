import { Suspense } from 'react';
import AdminDirectoryEditorClient from './AdminDirectoryEditorClient';

export default function AdminDirectoryEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12 text-white/60">Cargando editor del proveedor...</div>
      }
    >
      <AdminDirectoryEditorClient />
    </Suspense>
  );
}
