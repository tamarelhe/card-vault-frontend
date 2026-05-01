export default function SetPage({ params }: { params: { setCode: string } }) {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Set {params.setCode}</h1>
    </main>
  );
}
