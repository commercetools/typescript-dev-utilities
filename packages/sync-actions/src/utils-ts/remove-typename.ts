export default function removeTypename(obj: object & { __typename?: string }) {
  const { __typename, ...objWithoutTypename } = obj;
  return objWithoutTypename;
}
