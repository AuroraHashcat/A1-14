# main.py
from app.services.knowledge_service import KnowledgeService

def main():
    # 初始化服务
    service = KnowledgeService()
    
    # 1. 智能问答
    result = service.query("SM2和RSA算法的主要区别是什么？")
    print("回答:", result['answer'])
    print("置信度:", result['confidence'])
    print("参考来源:", result['sources'])
    
    # 2. 文档搜索
    search_results = service.search("密码应用安全性评估", limit=5)
    for item in search_results:
        print(f"标题: {item['title']}")
        print(f"摘要: {item['snippet']}")
    
    # 3. 生成考题
    questions = service.generate_questions(
        topic="网络通信安全", 
        difficulty="medium", 
        count=3
    )
    for i, q in enumerate(questions, 1):
        print(f"\n题目{i}: {q['question']}")
        for opt, content in q['options'].items():
            print(f"  {opt}. {content}")
        print(f"答案: {q['correct_answer']}")

if __name__ == "__main__":
    main()