import PhonicsOrientationGuard from './PhonicsOrientationGuard';

export default function PhonicsStandaloneLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="phonics-standalone-root h-[100dvh] min-h-0 overflow-hidden">
      <PhonicsOrientationGuard>{children}</PhonicsOrientationGuard>
    </div>
  );
}
