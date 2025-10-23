"""
知识库查询API
"""

from flask import request, jsonify, send_file
from app.api import bp
from app.models import Query, db
from app.services.knowledge_service import KnowledgeService
from app.services.export_service import build_question_bank_docx

@bp.route('/knowledge/query', methods=['POST'])
def query_knowledge():
    """知识库查询"""
    try:
        data = request.json
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({
                'success': False,
                'error': '问题不能为空'
            }), 400
        
        # 调用知识库服务
        service = KnowledgeService()
        result = service.query(question)
        
        # 保存查询记录
        query_record = Query(
            question=question,
            answer=result.get('answer'),
            context=result.get('context'),
            user_id=None  # 暂时匿名查询
        )
        
        db.session.add(query_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'question': question,
                'answer': result.get('answer'),
                'sources': result.get('sources', []),
                'confidence': result.get('confidence', 0.0)
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/knowledge/search', methods=['POST'])
def search_knowledge():
    """知识库搜索"""
    try:
        data = request.json
        query = data.get('query', '').strip()
        limit = data.get('limit', 5)
        
        if not query:
            return jsonify({
                'success': False,
                'error': '搜索关键词不能为空'
            }), 400
        
        service = KnowledgeService()
        results = service.search(query, limit=limit)
        
        return jsonify({
            'success': True,
            'data': {
                'query': query,
                'results': results
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/knowledge/generate-questions', methods=['POST'])
def generate_questions():
    """生成测试题目"""
    try:
        data = request.json
        topic = data.get('topic', '').strip()
        difficulty = data.get('difficulty', 'medium')  # easy, medium, hard
        count = data.get('count', 5)
        
        if not topic:
            return jsonify({
                'success': False,
                'error': '主题不能为空'
            }), 400
        
        service = KnowledgeService()
        questions = service.generate_questions(topic, difficulty, count)
        
        return jsonify({
            'success': True,
            'data': {
                'topic': topic,
                'difficulty': difficulty,
                'questions': questions
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/knowledge/questions/export', methods=['POST'])
def export_question_bank():
    """导出题库为 Word 文档。"""
    try:
        data = request.json or {}
        topic = data.get('topic', '').strip()
        difficulty = data.get('difficulty', 'medium')
        questions = data.get('questions', [])

        if not questions or not isinstance(questions, list):
            return jsonify({'success': False, 'error': '题目列表不能为空'}), 400

        buffer, filename = build_question_bank_docx(topic, difficulty, questions)
        return send_file(
            buffer,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=filename,
        )

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
