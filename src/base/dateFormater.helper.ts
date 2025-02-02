
//converte uma data no formato dd/mm/yyyy para um objeto Date
export const format = (date: string, format:string): Date => {
  const [day, month, year] = date.split('/');
  return new Date(`${year}-${month}-${day}`);
};