'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Switch, Tooltip, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { t } from '@/lib/i18n';
import { getCategories } from '@/lib/api/categories';
import {
  createMenuItem,
  deleteMenuItem,
  getMenu,
  getMenuTree,
  importMenuCategories,
  reorderMenu,
  updateMenuItem,
  type MenuItemNode,
  type MenuItemType,
} from '@/lib/api/menus';

type UiTreeNode = DataNode & {
  item: MenuItemNode;
  children?: UiTreeNode[];
};

function getNodeLabel(n: MenuItemNode): string {
  return String(n.label?.tr ?? Object.values(n.label || {})[0] ?? `#${n.id}`);
}

function toReorderPayload(nodes: UiTreeNode[]): Array<{ id: number; children?: any[] }> {
  return (nodes || []).map((n) => ({
    id: Number(n.item.id),
    children: toReorderPayload((n.children || []) as UiTreeNode[]),
  }));
}

export function AdminMenuBuilder({ menuId, showImportCategories }: { menuId: number; showImportCategories?: boolean }) {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);
  const [menuName, setMenuName] = useState('');

  const [tree, setTree] = useState<UiTreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedNode = useMemo(() => {
    if (!selectedKey) return null;
    const walk = (nodes: UiTreeNode[]): UiTreeNode | null => {
      for (const n of nodes) {
        if (String(n.key) === selectedKey) return n;
        const child = walk((n.children || []) as UiTreeNode[]);
        if (child) return child;
      }
      return null;
    };
    return walk(tree);
  }, [tree, selectedKey]);

  const selectedPath = useMemo(() => {
    if (!selectedKey) return [] as MenuItemNode[];

    const walk = (nodes: UiTreeNode[], target: string, path: MenuItemNode[]): MenuItemNode[] | null => {
      for (const n of nodes) {
        const nextPath = [...path, n.item];
        if (String(n.key) === target) return nextPath;
        const found = walk((n.children || []) as UiTreeNode[], target, nextPath);
        if (found) return found;
      }
      return null;
    };

    return walk(tree, selectedKey, []) ?? [];
  }, [tree, selectedKey]);

  const filteredTree = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tree;

    const filter = (nodes: UiTreeNode[]): UiTreeNode[] => {
      const out: UiTreeNode[] = [];
      for (const n of nodes) {
        const label = getNodeLabel(n.item).toLowerCase();
        const children = filter((n.children || []) as UiTreeNode[]);
        if (label.includes(q) || children.length > 0) {
          out.push({
            ...n,
            children,
          });
        }
      }
      return out;
    };

    return filter(tree);
  }, [tree, search]);

  const expandAllKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (nodes: UiTreeNode[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length) {
          keys.push(String(n.key));
          walk(n.children as UiTreeNode[]);
        }
      });
    };
    walk(filteredTree);
    return keys;
  }, [filteredTree]);

  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  const getCategoryName = (id: number | undefined | null) => {
    if (!id) return '';
    const found = categories.find((c) => c.id === Number(id));
    return found?.name ?? '';
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const reorderTimer = useRef<any>(null);

  const openCreateRoot = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ type: 'url', is_active: true });
    setCreateParentId(null);
    setCreateOpen(true);
  };

  const openCreateChild = (parentId: number) => {
    createForm.resetFields();
    createForm.setFieldsValue({ type: 'url', is_active: true });
    setCreateParentId(parentId);
    setCreateOpen(true);
  };

  const fetchBase = async () => {
    try {
      setLoading(true);
      const [{ menu }, { items }] = await Promise.all([getMenu(menuId), getMenuTree(menuId)]);
      setMenuName(menu.name);

      const toUiTree = (nodes: MenuItemNode[]): UiTreeNode[] => {
        return (nodes || []).map((n) => {
          const label = getNodeLabel(n);
          const key = String(n.id);
          const showActions = true;
          return {
            key,
            title: (
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey((prev) => (prev === key ? null : prev))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tooltip title={t('admin.menus.add_child_item', 'Alt Menü Ekle')}>
                    <Button
                      size="small"
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCreateChild(n.id);
                      }}
                    />
                  </Tooltip>

                  <Tooltip title={t('admin.common.delete', 'Sil')}>
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        modal.confirm({
                          title: t('admin.menus.delete_item_confirm_title', 'Item silinsin mi?'),
                          content: t('admin.menus.delete_item_confirm_desc', 'Bu item ve altındaki tüm itemlar silinecek.'),
                          okText: t('admin.common.delete', 'Sil'),
                          cancelText: t('admin.common.cancel', 'İptal'),
                          okButtonProps: { danger: true },
                          onOk: async () => {
                            try {
                              await deleteMenuItem(n.id);
                              message.success(t('admin.common.deleted', 'Silindi'));
                              setSelectedKey(null);
                              fetchBase();
                            } catch {
                              message.error(t('admin.common.delete_failed', 'Silinemedi'));
                            }
                          },
                        });
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            ),
            item: n,
            children: toUiTree(n.children || []),
          };
        });
      };

      const ui = toUiTree(items);
      setTree(ui);

      const collect = (nodes: UiTreeNode[], out: string[]) => {
        nodes.forEach((n) => {
          if (n.children && n.children.length) {
            out.push(String(n.key));
            collect(n.children, out);
          }
        });
      };
      const keys: string[] = [];
      collect(ui, keys);
      setExpandedKeys(keys);
    } catch {
      message.error(t('admin.menus.builder_load_failed', 'Menü yüklenemedi'));
    } finally {
      setLoading(false);
      setTreeLoading(false);
    }
  };

  const fetchCategoriesForPicker = async () => {
    try {
      const res: any = await getCategories({ paginate: false });
      const list = Array.isArray(res) ? res : res?.categories || res?.data || [];
      const mapped = (list as any[])
        .map((c) => ({ id: Number(c.id), name: String(c.name ?? '') }))
        .filter((c) => c.id && c.name);
      setCategories(mapped);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!menuId) return;
    void fetchBase();
    void fetchCategoriesForPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId]);

  const scheduleReorderSave = (nextTree: UiTreeNode[]) => {
    if (reorderTimer.current) clearTimeout(reorderTimer.current);
    reorderTimer.current = setTimeout(async () => {
      try {
        await reorderMenu(menuId, toReorderPayload(nextTree));
        message.success(t('admin.common.saved', 'Kaydedildi'));
      } catch {
        message.error(t('admin.common.save_failed', 'Kaydedilemedi'));
      }
    }, 250);
  };

  const onDrop = async (info: any) => {
    const dropKey = info.node.key as string;
    const dragKey = info.dragNode.key as string;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const data = [...tree];

    const loop = (nodes: UiTreeNode[], key: string, cb: (node: UiTreeNode, i: number, arr: UiTreeNode[]) => void) => {
      for (let i = 0; i < nodes.length; i++) {
        if (String(nodes[i].key) === key) {
          return cb(nodes[i], i, nodes);
        }
        if (nodes[i].children) {
          loop(nodes[i].children as UiTreeNode[], key, cb);
        }
      }
    };

    let dragObj: UiTreeNode | null = null;
    loop(data, dragKey, (node, index, arr) => {
      arr.splice(index, 1);
      dragObj = node;
    });

    if (!dragObj) return;

    if (!info.dropToGap) {
      loop(data, dropKey, (node) => {
        node.children = node.children || [];
        (node.children as UiTreeNode[]).unshift(dragObj!);
      });
    } else if ((info.node.children || []).length > 0 && info.node.expanded && dropPosition === 1) {
      loop(data, dropKey, (node) => {
        node.children = node.children || [];
        (node.children as UiTreeNode[]).unshift(dragObj!);
      });
    } else {
      let ar: UiTreeNode[] = [];
      let i: number = 0;
      loop(data, dropKey, (_node, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    setTree(data);
    scheduleReorderSave(data);
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title={menuName ? `${t('admin.menus.builder', 'Menü')}: ${menuName}` : t('admin.menus.builder', 'Menü')}
          >
            <div style={{ marginBottom: 12 }}>
              <Space wrap style={{ width: '100%', rowGap: 8 }}>
                <Input
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin.common.search', 'Ara...')}
                  style={{ width: 260 }}
                />

                <Button onClick={() => setExpandedKeys(expandAllKeys)} disabled={filteredTree.length === 0}>
                  {t('admin.common.expand_all', 'Hepsini Aç')}
                </Button>

                <Button onClick={() => setExpandedKeys([])} disabled={expandedKeys.length === 0}>
                  {t('admin.common.collapse_all', 'Hepsini Kapat')}
                </Button>

                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={openCreateRoot}
                  style={{ background: '#5E5CE6', borderColor: '#5E5CE6', fontWeight: 700 }}
                >
                  {t('admin.menus.add_root_item', 'Kök Item Ekle')}
                </Button>

                {showImportCategories ? (
                  <Button
                    onClick={() => {
                      modal.confirm({
                        title: t('admin.menus.import_categories_title', 'Tüm kategoriler içe aktarılsın mı?'),
                        content: t('admin.menus.import_categories_desc', 'Mevcut menü sıfırlanıp kategoriler otomatik eklenecek.'),
                        okText: t('admin.menus.import_full_tree', 'Tüm Ağaç'),
                        cancelText: t('admin.menus.import_root_only', 'Sadece Üst Kategoriler'),
                        onOk: async () => {
                          try {
                            await importMenuCategories(menuId, 'replace', null);
                            message.success(t('admin.common.saved', 'Kaydedildi'));
                            fetchBase();
                          } catch {
                            message.error(t('admin.common.save_failed', 'Kaydedilemedi'));
                          }
                        },
                        onCancel: async () => {
                          try {
                            await importMenuCategories(menuId, 'replace', 1);
                            message.success(t('admin.common.saved', 'Kaydedildi'));
                            fetchBase();
                          } catch {
                            message.error(t('admin.common.save_failed', 'Kaydedilemedi'));
                          }
                        },
                      });
                    }}
                  >
                    {t('admin.menus.import_all_categories', 'Tüm kategorileri ekle')}
                  </Button>
                ) : null}
              </Space>
            </div>

            {treeLoading || loading ? (
              <div style={{ padding: 16, color: '#64748b' }}>{t('admin.common.loading', 'Yükleniyor...')}</div>
            ) : (
              <Tree
                draggable
                blockNode
                showLine
                expandAction="click"
                onDrop={onDrop}
                treeData={filteredTree}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys as string[])}
                selectedKeys={selectedKey ? [selectedKey] : []}
                onSelect={(keys, info) => {
                  const key = keys?.[0] ? String(keys[0]) : null;
                  setSelectedKey(key);
                  if (!key) return;

                  if (info?.node && (info.node as any).children && (info.node as any).children.length > 0) {
                    setExpandedKeys((prev) => {
                      const set = new Set(prev);
                      if (set.has(key)) set.delete(key);
                      else set.add(key);
                      return Array.from(set);
                    });
                  }
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t('admin.menus.item_details', 'Yönlendirme Detayı')}>
            {selectedNode ? (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{getNodeLabel(selectedNode.item)}</div>

                {selectedPath.length > 0 ? (
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    {selectedPath.map((p) => getNodeLabel(p)).join(' / ')}
                  </div>
                ) : null}

                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {selectedNode.item.type === 'category'
                    ? `${t('admin.menus.fields.category', 'Kategori')}: #${selectedNode.item.category_id ?? '-'}`
                    : `${t('admin.menus.fields.url', 'URL')}: ${selectedNode.item.url ?? '-'}`}
                </div>

                <Space wrap>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      const it = selectedNode.item;
                      editForm.setFieldsValue({
                        type: it.type,
                        label_tr: it.label?.tr ?? '',
                        url: it.url ?? '',
                        category_id: it.category_id ?? undefined,
                        is_active: it.is_active,
                      });
                      setEditOpen(true);
                    }}
                  >
                    {t('admin.common.edit', 'Düzenle')}
                  </Button>

                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      modal.confirm({
                        title: t('admin.menus.delete_item_confirm_title', 'Item silinsin mi?'),
                        content: t('admin.menus.delete_item_confirm_desc', 'Bu item ve altındaki tüm itemlar silinecek.'),
                        okText: t('admin.common.delete', 'Sil'),
                        cancelText: t('admin.common.cancel', 'İptal'),
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await deleteMenuItem(selectedNode.item.id);
                            message.success(t('admin.common.deleted', 'Silindi'));
                            setSelectedKey(null);
                            fetchBase();
                          } catch {
                            message.error(t('admin.common.delete_failed', 'Silinemedi'));
                          }
                        },
                      });
                    }}
                  >
                    {t('admin.common.delete', 'Sil')}
                  </Button>
                </Space>

                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {t('admin.menus.tip_autosave', 'Sürükle-bırak ve düzenlemeler otomatik kaydedilir.')}
                </div>
              </Space>
            ) : (
              <div style={{ color: '#64748b' }}>
                {t('admin.menus.select_item', 'Soldan bir item seçin veya yeni item ekleyin.')}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        open={createOpen}
        title={t('admin.menus.add_item', 'Item Ekle')}
        okText={t('admin.common.create', 'Oluştur')}
        cancelText={t('admin.common.cancel', 'İptal')}
        confirmLoading={saving}
        onCancel={() => setCreateOpen(false)}
        onOk={async () => {
          try {
            const values = await createForm.validateFields();
            setSaving(true);

            const type = values.type as MenuItemType;
            const labelTr =
              String(values.label_tr || '').trim() ||
              (type === 'category' ? getCategoryName(values.category_id) : '');

            await createMenuItem(menuId, {
              parent_id: createParentId,
              type,
              label: { tr: labelTr },
              url: type === 'url' ? values.url : undefined,
              category_id: type === 'category' ? values.category_id : undefined,
              target: '_self',
              is_active: values.is_active,
            });

            setCreateOpen(false);
            message.success(t('admin.common.saved', 'Kaydedildi'));
            fetchBase();
          } catch {
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form layout="vertical" form={createForm}>
          <div style={{ marginBottom: 12, color: '#64748b', fontSize: 12 }}>
            {createParentId
              ? t('admin.menus.add_under_selected', 'Seçili item altına eklenecek.')
              : t('admin.menus.add_as_root', 'Kök seviyeye eklenecek.')}
          </div>

          <Form.Item name="type" label={t('admin.menus.fields.type', 'Tip')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'url', label: t('admin.menus.types.url', 'Özel Link') },
                { value: 'category', label: t('admin.menus.types.category', 'Kategori') },
              ]}
            />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const type = createForm.getFieldValue('type') as MenuItemType;
              const required = type === 'url';
              return (
                <Form.Item
                  name="label_tr"
                  label={t('admin.menus.fields.label', 'Başlık (TR)')}
                  rules={required ? [{ required: true }] : []}
                >
                  <Input placeholder={t('admin.menus.fields.label_placeholder', 'Örn: Yeni Gelenler')} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const type = createForm.getFieldValue('type') as MenuItemType;
              if (type === 'category') {
                return (
                  <Form.Item name="category_id" label={t('admin.menus.fields.category', 'Kategori')} rules={[{ required: true }]}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      onChange={(val) => {
                        const current = String(createForm.getFieldValue('label_tr') || '').trim();
                        if (current) return;
                        const name = getCategoryName(Number(val));
                        if (name) createForm.setFieldValue('label_tr', name);
                      }}
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </Form.Item>
                );
              }

              return (
                <Form.Item name="url" label={t('admin.menus.fields.url', 'URL')} rules={[{ required: true }]}>
                  <Input placeholder="/kampanyalar" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="is_active" label={t('admin.menus.fields.active', 'Aktif')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

        </Form>
      </Modal>

      <Modal
        open={editOpen}
        title={t('admin.menus.edit_item', 'Item Düzenle')}
        okText={t('admin.common.save', 'Kaydet')}
        cancelText={t('admin.common.cancel', 'İptal')}
        confirmLoading={saving}
        onCancel={() => setEditOpen(false)}
        onOk={async () => {
          if (!selectedNode) return;
          try {
            const values = await editForm.validateFields();
            setSaving(true);

            const type = values.type as MenuItemType;
            const labelTr =
              String(values.label_tr || '').trim() ||
              (type === 'category' ? getCategoryName(values.category_id) : '');

            await updateMenuItem(selectedNode.item.id, {
              type,
              label: { tr: labelTr },
              url: type === 'url' ? values.url : undefined,
              category_id: type === 'category' ? values.category_id : undefined,
              target: '_self',
              is_active: values.is_active,
            });

            setEditOpen(false);
            message.success(t('admin.common.saved', 'Kaydedildi'));
            fetchBase();
          } catch {
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item name="type" label={t('admin.menus.fields.type', 'Tip')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'url', label: t('admin.menus.types.url', 'Özel Link') },
                { value: 'category', label: t('admin.menus.types.category', 'Kategori') },
              ]}
            />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const type = editForm.getFieldValue('type') as MenuItemType;
              const required = type === 'url';
              return (
                <Form.Item
                  name="label_tr"
                  label={t('admin.menus.fields.label', 'Başlık (TR)')}
                  rules={required ? [{ required: true }] : []}
                >
                  <Input />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const type = editForm.getFieldValue('type') as MenuItemType;
              if (type === 'category') {
                return (
                  <Form.Item name="category_id" label={t('admin.menus.fields.category', 'Kategori')} rules={[{ required: true }]}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      onChange={(val) => {
                        const current = String(editForm.getFieldValue('label_tr') || '').trim();
                        if (current) return;
                        const name = getCategoryName(Number(val));
                        if (name) editForm.setFieldValue('label_tr', name);
                      }}
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </Form.Item>
                );
              }

              return (
                <Form.Item name="url" label={t('admin.menus.fields.url', 'URL')} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="is_active" label={t('admin.menus.fields.active', 'Aktif')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
