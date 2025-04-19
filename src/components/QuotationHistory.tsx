import { useQuery } from '@tanstack/react-query';
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';

export default function QuotationHistory({ userId }: { userId: string }) {
  const { data } = useQuery(['quotations', userId], async () => {
    const res = await fetch(`/api/users/${userId}/quotations`);
    return res.json();
  });

  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Date</Th>
          <Th>Client</Th>
          <Th>Amount</Th>
          <Th>ERP Reference</Th>
        </Tr>
      </Thead>
      <Tbody>
        {data?.map((q: any) => (
          <Tr key={q.id}>
            <Td>{new Date(q.createdAt).toLocaleDateString()}</Td>
            <Td>{q.data.clientInfo.name}</Td>
            <Td>${q.data.priceBreakdown.total}</Td>
            <Td>{q.erpReferenceId || 'Pending'}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
