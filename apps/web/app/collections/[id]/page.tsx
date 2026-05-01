export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Collection {params.id}</h1>
    </main>
  );
}
