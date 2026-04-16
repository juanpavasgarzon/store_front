export {
  useRouter,
  usePathname,
  redirect,
} from 'next/navigation';
export { default as Link } from 'next/link';

export function getPathname({ href }: { href: string }): string {
  return href;
}
