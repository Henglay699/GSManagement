interface Permission {
  id: number;
  permissionName: string;
  description: string;
  module: string;
  createdAt: Date;
}

export default Permission;
