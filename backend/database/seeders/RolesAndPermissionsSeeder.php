<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $modules = [
            'products' => ['index', 'create', 'edit', 'destroy'],
            'categories' => ['index', 'create', 'edit', 'destroy'],
            'brands' => ['index', 'create', 'edit', 'destroy'],
            'variations' => ['index', 'create', 'edit', 'destroy'],
            'options' => ['index', 'create', 'edit', 'destroy'],
            'attributes' => ['index', 'create', 'edit', 'destroy'],
            'tags' => ['index', 'create', 'edit', 'destroy'],
            'units' => ['index', 'create', 'edit', 'destroy'],
            'media' => ['index', 'create', 'edit', 'destroy'],
            'tax' => ['index', 'create', 'edit', 'destroy'],
            'currencies' => ['index', 'create', 'edit', 'destroy'],
            'users' => ['index', 'create', 'edit', 'destroy'],
            'roles' => ['index', 'create', 'edit', 'destroy'],
            'settings' => ['edit'],
            'orders' => ['index', 'create', 'edit', 'destroy', 'statistics'],
            'customers' => ['index', 'create', 'edit', 'destroy', 'statistics'],
            'shipping_methods' => ['index', 'create', 'edit', 'destroy'],
            'tax_classes' => ['index', 'create', 'edit', 'destroy'],
            'google_categories' => ['index'],
            'coupons' => ['index', 'create', 'edit', 'destroy'],
            'customer_groups' => ['index', 'create', 'edit', 'destroy'],
        ];

        $allPermissions = [];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $permissionName = "{$module}.{$action}";
                Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
                $allPermissions[] = $permissionName;
            }
        }

        // Additional legacy permissions if any
        $legacyPermissions = [
            'users.manage',
            'roles.manage',
        ];

        foreach ($legacyPermissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
            $allPermissions[] = $name;
        }

        // Roles
        $superAdmin = Role::firstOrCreate(['name' => 'SuperAdmin', 'guard_name' => 'web']);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $editor = Role::firstOrCreate(['name' => 'editor', 'guard_name' => 'web']);
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);

        $superAdmin->syncPermissions($allPermissions);
        $admin->syncPermissions($allPermissions);

        $editorPermissions = array_filter($allPermissions, function($p) {
            return !str_contains($p, 'users.') && !str_contains($p, 'roles.') && !str_contains($p, 'settings.') && !str_contains($p, 'destroy');
        });
        $editor->syncPermissions($editorPermissions);

        $viewerPermissions = array_filter($allPermissions, function($p) {
            return str_contains($p, '.index');
        });
        $viewer->syncPermissions($viewerPermissions);
    }
}
