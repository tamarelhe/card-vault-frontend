export default async function SetPage({ params }: { params: Promise<{ setCode: string }> }) {
  const { setCode } = await params;
  return (
    <main className="container mx-auto p-8">
      <h1 className="font-serif text-3xl font-bold text-white">Set {setCode}</h1>
    </main>
  );
}
