export interface Job {
  id: string;
  title: string;
  location: string;
  department: string;
  description: string;
}

export const jobOpenings: Job[] = [
  {
    id: 'senior-frontend-engineer',
    title: 'Senior Frontend Engineer',
    location: 'Remote',
    department: 'Engineering',
    description: 'We are looking for a Senior Frontend Engineer to join our team. You will be responsible for building and maintaining our web application. You will work closely with our product and design teams to create a beautiful and intuitive user experience.',
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    location: 'Remote',
    department: 'Product',
    description: 'We are looking for a Product Manager to join our team. You will be responsible for the product roadmap and will work closely with our engineering and design teams to create a product that our customers love.',
  },
  {
    id: 'customer-success-manager',
    title: 'Customer Success Manager',
    location: 'Remote',
    department: 'Customer Success',
    description: 'We are looking for a Customer Success Manager to join our team. You will be responsible for ensuring that our customers are successful with our product. You will work closely with our sales and product teams to provide our customers with the best possible experience.',
  },
];