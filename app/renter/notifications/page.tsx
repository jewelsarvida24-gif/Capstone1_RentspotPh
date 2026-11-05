import NotificationList from '@/components/notifications/NotificationList';

export default function NotificationsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Notifications</h1>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <NotificationList />
      </div>
    </main>
  );
}