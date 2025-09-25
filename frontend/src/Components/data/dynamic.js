import { Boxes, HomeIcon, FileStack, Calendar1 } from 'lucide-react';

const features = [
  {
    featureName: 'Home',
    displayName: 'Home',
    logoUsed: HomeIcon,
    route: '/dashboard',
    allowedRoles: ["user", "admin"],
  },
];

export { features };
