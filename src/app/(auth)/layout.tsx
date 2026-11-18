import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo size={48} withText={false} />
        <h1 className="font-display text-[28px] font-bold leading-9">
          Pose <span className="text-primary">Xinh</span>
        </h1>
        <p className="text-text-2">Hết bí dáng từ hôm nay</p>
      </div>
      {children}
    </main>
  );
}
