/** 将用户选择的图片压成 JPEG data URL，减轻 localStorage 压力 */
export function compressImageForLocalStorage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('not-image'))
            return
        }
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            let { width, height } = img
            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }
            if (height < 1 || width < 1) {
                reject(new Error('invalid-size'))
                return
            }
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(width)
            canvas.height = Math.round(height)
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('no-ctx'))
                return
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            try {
                resolve(canvas.toDataURL('image/jpeg', quality))
            } catch {
                reject(new Error('encode-fail'))
            }
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('load-fail'))
        }
        img.src = url
    })
}
