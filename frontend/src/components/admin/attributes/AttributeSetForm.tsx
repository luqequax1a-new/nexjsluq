"use client";

import { Button, Card, Col, Form, Input, Row, Space, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

export function AttributeSetForm({ form }: { form: any }) {
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="name"
                            label="Set Adı"
                            rules={[{ required: true, message: "Set adı zorunludur" }]}
                        >
                            <Input size="large" placeholder="Örn: Kumaş Özellikleri" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card bordered={false} title="Özellikler">
                <Form.List name="attributes">
                    {(fields, { add, remove }) => (
                        <>
                            <Space direction="vertical" style={{ width: "100%" }} size={12}>
                                {fields.map((field) => (
                                    <Card
                                        key={field.key}
                                        size="small"
                                        style={{ borderRadius: 10 }}
                                        title={
                                            <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                                                <Text strong>Özellik</Text>
                                                <Button
                                                    danger
                                                    type="text"
                                                    icon={<MinusCircleOutlined />}
                                                    onClick={() => remove(field.name)}
                                                />
                                            </Space>
                                        }
                                    >
                                        <Row gutter={16}>
                                            <Col span={16}>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, "name"]}
                                                    label="Ad"
                                                    rules={[{ required: true, message: "Özellik adı zorunludur" }]}
                                                >
                                                    <Input placeholder="Örn: Gramaj" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...field} name={[field.name, "position"]} label="Sıra">
                                                    <Input placeholder="0" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.List name={[field.name, "values"]}>
                                            {(vFields, { add: addV, remove: removeV }) => (
                                                <>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                                        <Text type="secondary">Değerler</Text>
                                                        <Button
                                                            type="dashed"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => addV({ value: "", position: vFields.length })}
                                                        >
                                                            Değer Ekle
                                                        </Button>
                                                    </div>

                                                    <Space direction="vertical" style={{ width: "100%" }} size={8}>
                                                        {vFields.map((vf) => (
                                                            <Card key={vf.key} size="small">
                                                                <Row gutter={16}>
                                                                    <Col span={16}>
                                                                        <Form.Item
                                                                            {...vf}
                                                                            name={[vf.name, "value"]}
                                                                            label="Değer"
                                                                            rules={[{ required: true, message: "Değer zorunludur" }]}
                                                                        >
                                                                            <Input placeholder="Örn: 200g" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={6}>
                                                                        <Form.Item {...vf} name={[vf.name, "position"]} label="Sıra">
                                                                            <Input placeholder="0" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={2} style={{ display: "flex", alignItems: "end", paddingBottom: 8 }}>
                                                                        <Button
                                                                            danger
                                                                            type="text"
                                                                            icon={<MinusCircleOutlined />}
                                                                            onClick={() => removeV(vf.name)}
                                                                        />
                                                                    </Col>
                                                                </Row>
                                                            </Card>
                                                        ))}
                                                    </Space>
                                                </>
                                            )}
                                        </Form.List>
                                    </Card>
                                ))}
                            </Space>

                            <Button type="primary" icon={<PlusOutlined />} onClick={() => add({ values: [] })}>
                                Özellik Ekle
                            </Button>
                        </>
                    )}
                </Form.List>
            </Card>
        </div>
    );
}
