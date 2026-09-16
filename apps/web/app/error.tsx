'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center'>
      <h1 className='text-xl font-semibold'>导航内容暂时无法加载</h1>
      <p className='text-muted-foreground'>请稍后重试。</p>
      <button
        type='button'
        onClick={reset}
        className='rounded-md border px-4 py-2 hover:bg-accent'
      >
        重新加载
      </button>
    </main>
  );
}
