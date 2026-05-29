"use client";

/**
 * React hooks for reading the registry from chain via wagmi. Reads are done with
 * view functions; lists are fetched with batched multicall (useReadContracts).
 */
import { useReadContract, useReadContracts } from "wagmi";
import { registryAbi, registryContract, type Inscription } from "./contract";

/** Total number of inscriptions on the contract. */
export function useTotal() {
  return useReadContract({
    ...registryContract,
    functionName: "total",
  });
}

/** Inscription ids owned by an address. */
export function useOwnerIds(owner?: `0x${string}`) {
  return useReadContract({
    ...registryContract,
    functionName: "getByOwner",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });
}

export type IndexedInscription = Inscription & { id: bigint };

/** Fetch full inscription records for a list of ids (batched). */
export function useInscriptionsByIds(ids: readonly bigint[] | undefined) {
  const enabled = !!ids && ids.length > 0;
  const result = useReadContracts({
    contracts: (ids ?? []).map((id) => ({
      ...registryContract,
      functionName: "getInscription" as const,
      args: [id] as const,
    })),
    query: { enabled },
  });

  const data: IndexedInscription[] | undefined = result.data
    ?.map((r, i) => {
      if (r.status !== "success" || !r.result) return null;
      const rec = r.result as unknown as Inscription;
      return { ...rec, id: ids![i] };
    })
    .filter((x): x is IndexedInscription => x !== null);

  return { ...result, records: data };
}

/** Single inscription by id. */
export function useInscription(id?: bigint) {
  const result = useReadContract({
    ...registryContract,
    functionName: "getInscription",
    args: id !== undefined ? [id] : undefined,
    query: { enabled: id !== undefined },
  });
  const record = result.data
    ? ({ ...(result.data as unknown as Inscription), id: id! } as IndexedInscription)
    : undefined;
  return { ...result, record };
}

export { registryAbi };
