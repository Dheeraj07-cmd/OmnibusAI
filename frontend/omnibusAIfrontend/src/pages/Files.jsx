import { useState, useEffect, useRef } from 'react';
import { UploadCloud, File, Image as ImageIcon, FileText, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Card } from '@/components/ui/card';

export default function Files() {
  const [files, setFiles] = useState([]); 
  const [isUploading, setIsUploading] = useState(false); 
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => { fetchFiles(); }, []);
  const fetchFiles = async () => { try { const res = await api.get('/files'); setFiles(res.data); } catch (e) { console.error(e); } };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return; 
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', selectedFile);
    try { await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); fetchFiles(); } 
    catch (err) { alert('Upload failed'); } 
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files[0]); };

  const formatBytes = (b) => { if (b === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };
  const getFileIcon = (t) => { if (!t) return <File className="text-neutral-500" size={28} />; if (t.includes('image')) return <ImageIcon className="text-blue-500" size={28} />; if (t.includes('pdf') || t.includes('text')) return <FileText className="text-purple-500" size={28} />; return <File className="text-neutral-500" size={28} />; };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-4 md:p-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">File Intelligence</h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">Secure cloud storage powered by Cloudinary CDN.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card 
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()} 
            className={`border-2 border-dashed transition-all cursor-pointer p-8 md:p-12 text-center rounded-3xl 
              ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' : 'border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 hover:bg-neutral-100/50'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => handleUpload(e.target.files[0])} />
            <div className="flex flex-col items-center justify-center space-y-3">
              {isUploading ? <Loader2 size={40} className="text-blue-500 animate-spin" /> : <UploadCloud size={40} className={`text-blue-500 transition-transform ${isDragging ? 'scale-125 animate-pulse' : ''}`} />}
              <div className="text-base md:text-lg font-medium">{isUploading ? 'Uploading to cloud...' : isDragging ? 'Drop file here!' : 'Click to upload or drag and drop'}</div>
              <p className="text-xs text-neutral-500">Supports images, PDFs, and raw code snippets.</p>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
          {files.length === 0 ? <div className="text-center text-neutral-500 py-10 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-sm">No files uploaded yet.</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <motion.div key={file.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="p-4 flex flex-col items-center text-center space-y-3 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 h-full">
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full">{getFileIcon(file.fileType)}</div>
                    <div className="w-full flex-1"><p className="text-xs md:text-sm font-medium truncate" title={file.fileName}>{file.fileName}</p><p className="text-[10px] text-neutral-500 mt-0.5">{formatBytes(file.fileSize)}</p></div>
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 rounded-lg"><Download size={14} /> Download</a>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}