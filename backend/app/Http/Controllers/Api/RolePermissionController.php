<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:roles.index')->only(['getRoles', 'getPermissions']);
        $this->middleware('permission:roles.create')->only(['createRole']);
        $this->middleware('permission:roles.edit')->only(['updateRole']);
        $this->middleware('permission:roles.destroy')->only(['deleteRole']);
    }

    public function getRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'created_at' => $role->created_at,
            ];
        });

        return response()->json($roles);
    }

    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
            ];
        });

        return response()->json($permissions);
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($data['permissions']);

        return response()->json([
            'message' => 'Role permissions updated successfully',
            'role' => $role->load('permissions'),
        ]);
    }

    public function createRole(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $data['name']]);
        
        if (!empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'role' => $role->load('permissions'),
        ], 201);
    }

    public function deleteRole(Role $role): JsonResponse
    {
        if (in_array($role->name, ['admin', 'SuperAdmin'])) {
            return response()->json([
                'message' => 'Cannot delete system roles (admin, SuperAdmin)',
            ], 403);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ]);
    }
}
