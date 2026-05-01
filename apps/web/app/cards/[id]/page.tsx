export default function CardDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Card {params.id}</h1>
    </main>
  );
}
