import { Boxes, HomeIcon, FileStack, Calendar1, Upload } from 'lucide-react';

const features = [
  {
    featureName: 'Home',
    displayName: 'Home',
    logoUsed: HomeIcon,
    route: '/dashboard',
    allowedRoles: ["user", "admin"],
  },
  {
    featureName: 'AdUpload',
    displayName: 'Upload',
    logoUsed: Upload,
    route: '/add-upload',
    allowedRoles: ["user", "admin"],
  },
];

export { features };
