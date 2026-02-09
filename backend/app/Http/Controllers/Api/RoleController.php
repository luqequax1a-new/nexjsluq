<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:roles.manage');
    }

    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->get();

        $permissions = Permission::query()->orderBy('name')->get();

        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($data['permissions'] ?? []);

        return response()->json([
            'role' => $role->load('permissions'),
        ]);
    }
}
