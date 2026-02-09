"use client";

import { Form, Button, Popconfirm, Typography, Image } from "antd";
import { CloudUploadOutlined, CloseOutlined, PictureOutlined, EyeOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
import { MediaLibraryModal } from "@/components/admin/media/MediaLibraryModal";
import type { MediaItem } from "@/types/media";

const { Text } = Typography;

interface SingleImageSectionProps {
  fieldName?: string;
  label?: string;
}

export function SingleImageSection({ fieldName = 'image', label = 'Görsel' }: SingleImageSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue, setFieldValue }) => {
        const imageUrl = getFieldValue(fieldName);
        
        const onFiles = async (files: FileList) => {
          const file = files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            setFieldValue(fieldName, e.target?.result as string);
          };
          reader.readAsDataURL(file);
        };

        const handleRemove = () => {
          setFieldValue(fieldName, '');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };

        const onLibrarySelect = (selected: MediaItem[]) => {
          if (selected.length > 0) {
            // For library images, we'd need the full URL
            const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
            const path = selected[0].path.startsWith("/") ? selected[0].path.slice(1) : selected[0].path;
            setFieldValue(fieldName, `${base}/storage/${path}`);
          }
        };

        return (
          <div style={{ position: "relative" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && onFiles(e.target.files)}
              style={{ display: 'none' }}
            />

            {/* Kütüphaneden Seç Butonu */}
            <div style={{ position: "absolute", top: -45, right: 0, zIndex: 10 }}>
              <Button
                icon={<PictureOutlined />}
                onClick={() => setLibraryOpen(true)}
                style={{
                  borderRadius: 8,
                  height: 36,
                  fontWeight: 600,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
              >
                Kütüphaneden Seç
              </Button>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
              style={{
                border: "2px dashed #e2e8f0",
                borderRadius: 16,
                padding: imageUrl ? "24px" : "64px 24px",
                textAlign: "center",
                background: "#f8fafc",
                transition: "all 0.3s ease",
                minHeight: imageUrl ? "180px" : "260px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              {!imageUrl ? (
                <>
                  <div style={{
                    width: 56,
                    height: 56,
                    background: "#ffffff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    marginBottom: 20,
                    color: "#94a3b8"
                  }}>
                    <CloudUploadOutlined style={{ fontSize: 28 }} />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Button
                      type="link"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: 0,
                        height: "auto",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#5E5CE6"
                      }}
                    >
                      Dosya seç
                    </Button>
                    <span style={{ color: "#64748b", fontSize: 16, fontWeight: 500 }}> veya sürükle bırak</span>
                  </div>

                  <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                    PNG, JPG, GIF (max. 10MB)
                  </Text>
                </>
              ) : (
                <div style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  width: "100%"
                }}>
                  <div
                    className="media-tile"
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 12,
                      border: "1px solid #f1f5f9",
                      background: "#ffffff",
                      overflow: "hidden",
                      position: "relative",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div className="media-tile-actions">
                      <div 
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewVisible(true);
                        }}
                      >
                        <EyeOutlined />
                      </div>
                      <Popconfirm
                        title="Görseli sil?"
                        onConfirm={(e) => { e?.preventDefault(); e?.stopPropagation(); handleRemove(); }}
                        okText="Sil"
                        cancelText="İptal"
                      >
                        <div className="action-icon" onClick={(e) => e.stopPropagation()}>
                          <CloseOutlined />
                        </div>
                      </Popconfirm>
                    </div>

                    <style jsx>{`
                      .media-tile-actions {
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        opacity: 0;
                        transition: all 0.2s;
                        z-index: 10;
                        display: flex;
                        gap: 4px;
                      }
                      .media-tile:hover .media-tile-actions {
                        opacity: 1;
                      }
                      .action-icon {
                        font-size: 18px;
                        color: #ffffff;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      }
                      .action-icon:hover {
                        color: #ef4444;
                        transform: scale(1.1);
                      }
                    `}</style>
                  </div>
                </div>
              )}
            </div>

            <MediaLibraryModal
              open={libraryOpen}
              onCancel={() => setLibraryOpen(false)}
              onSelect={onLibrarySelect}
              multiple={false}
            />

            {imageUrl && (
              <div style={{ display: 'none' }}>
                <Image.PreviewGroup
                  preview={{
                    visible: previewVisible,
                    onVisibleChange: (visible) => setPreviewVisible(visible),
                  }}
                >
                  <Image src={imageUrl} alt="Preview" />
                </Image.PreviewGroup>
              </div>
            )}

            <Form.Item name={fieldName} hidden>
              <input type="hidden" />
            </Form.Item>
          </div>
        );
      }}
    </Form.Item>
  );
}
