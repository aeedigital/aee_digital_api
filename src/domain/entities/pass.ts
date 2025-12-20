export interface Pass {
  id: string;
  user: string;
  pass: string;
  scopeId: string;
  groups: string[];
  lastLogged?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
