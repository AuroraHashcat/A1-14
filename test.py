from sentence_transformers import SentenceTransformer

# 指定本地保存路径
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
model.save('data/models/all-MiniLM-L6-v2')