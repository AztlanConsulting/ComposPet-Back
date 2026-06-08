const getFileTypeFromFile = async (filePath) => {
    const { fileTypeFromFile } = await import('file-type');
    return fileTypeFromFile(filePath);
};

module.exports = {
    getFileTypeFromFile,
};