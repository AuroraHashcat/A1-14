import json
import os
from datetime import datetime, timedelta
import random
from faker import Faker
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch
from PIL import Image, ImageDraw, ImageFont
import io
import textwrap

class ChineseTestDataGenerator:
    def __init__(self):
        self.fake = Faker('zh_CN')
        self.base_dir = "chinese_test_dataset"
        self.setup_directories()
        self.setup_chinese_fonts()
        
    def setup_directories(self):
        """创建完整的目录结构"""
        directories = [
            f"{self.base_dir}/documents/application_forms",
            f"{self.base_dir}/documents/site_records", 
            f"{self.base_dir}/documents/images",
            f"{self.base_dir}/extracted_json",
            f"{self.base_dir}/metadata"
        ]
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def setup_chinese_fonts(self):
        """设置中文字体"""
        # 尝试注册中文字体
        self.chinese_font_available = False
        try:
            # 常见的中文字体路径
            font_paths = [
                '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',  # Linux
                '/usr/share/fonts/truetype/arphic/ukai.ttc',       # Linux
                # '/System/Library/Fonts/Arial Unicode.ttf',         # Mac
                # 'C:/Windows/Fonts/simhei.ttf',                     # Windows
                # 'C:/Windows/Fonts/simsun.ttc',                     # Windows
                # 'C:/Windows/Fonts/msyh.ttc',                       # Windows
            ]
            
            for font_path in font_paths:
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('ChineseFont', font_path))
                        self.chinese_font_available = True
                        self.chinese_font_path = font_path
                        print(f"成功加载中文字体: {font_path}")
                        break
                    except Exception as e:
                        print(f"字体加载失败 {font_path}: {e}")
                        continue
            
            if not self.chinese_font_available:
                print("警告: 未找到可用的中文字体，将使用默认字体")
                
        except Exception as e:
            print(f"字体设置错误: {e}")

    def generate_unit_info(self):
        return {
            "unit_name": "示例单位",
            "unit_address": "北京市海淀区示例路1号",
            "provincial_password_authority": "北京市密码管理局",
            "postal_code": "100000"
        }

    def generate_contact_info(self):
        return {
            "name": self.fake.name(),
            "department": "信息技术部",
            "mobile_phone": self.fake.phone_number(),
            "title_position": "工程师",
            "office_phone": self.fake.phone_number(),
            "email": self.fake.email()
        }

    def generate_system_info(self, case_type="normal"):
        return {
            "system_name": random.choice(["金融核心业务系统", "电子政务平台", "医疗信息系统"]),
            "is_critical_infrastructure": case_type == "critical",
            "critical_infrastructure_status": {},
            "classification_status": {},
            "cybersecurity_evaluation": {},
            "cryptography_assessment": {},
            "cloud_platform_dependency": {}
        }

    def generate_application_form_json(self, case_id, case_type="normal"):
        """生成申请表JSON数据（带根键 application_form）"""
        # 准备字段，缺失值使用 '未提及'
        unit = self.generate_unit_info() or {}
        contact = self.generate_contact_info() or {}
        system = self.generate_system_info(case_type) or {}
        agency = {
            "agency_name": "未提及",
            "agency_address": "未提及",
            "postal_code": "未提及",
            "contact_person": {
                "name": "未提及",
                "department": "未提及",
                "mobile_phone": "未提及",
                "title_position": "未提及",
                "office_phone": "未提及",
                "email": "未提及"
            },
            "document_metadata": {
                "prepared_by": "未提及",
                "preparation_date": "未提及",
                "reviewed_by": "未提及",
                "review_date": "未提及",
                "approved_by": "未提及",
                "approval_date": "未提及"
            }
        }

        # 合并信息并保证字段完整
        json_data = {
            "application_form": {
                "unit_information": {
                    "unit_name": unit.get('unit_name', '未提及'),
                    "unit_address": unit.get('unit_address', '未提及'),
                    "provincial_password_authority": unit.get('provincial_password_authority', '未提及'),
                    "postal_code": unit.get('postal_code', '未提及')
                },
                "contact_information": {
                    "name": contact.get('name', '未提及'),
                    "department": contact.get('department', '未提及'),
                    "mobile_phone": contact.get('mobile_phone', '未提及'),
                    "title_position": contact.get('title_position', '未提及'),
                    "office_phone": contact.get('office_phone', '未提及'),
                    "email": contact.get('email', '未提及')
                },
                "information_system": {
                    "system_name": system.get('system_name', '未提及'),
                    "is_critical_infrastructure": system.get('is_critical_infrastructure', False),
                    "critical_infrastructure_status": system.get('critical_infrastructure_status', {
                        "identified": False,
                        "governing_department": "未提及",
                        "unidentified": True
                    }),
                    "classification_status": system.get('classification_status', {
                        "has_classified": False,
                        "level": "未提及",
                        "filing_certificate_number": "未提及",
                        "is_consistent_with_tested": False,
                        "change_description": "未提及",
                        "not_classified": True,
                        "evaluation_basis": "未提及"
                    }),
                    "cybersecurity_evaluation": system.get('cybersecurity_evaluation', {
                        "status": "未提及",
                        "evaluation_org_name": "未提及",
                        "evaluation_time": "未提及",
                        "evaluation_conclusion": "未提及"
                    }),
                    "cryptography_assessment": system.get('cryptography_assessment', {
                        "status": "未提及",
                        "assessment_org_name": "未提及",
                        "assessment_time": "未提及",
                        "assessment_conclusion": "未提及"
                    }),
                    "cloud_platform_dependency": system.get('cloud_platform_dependency', {
                        "has_dependency": False,
                        "platform_name": "未提及",
                        "platform_assessment_status": "未提及",
                        "assessment_org_name": "未提及",
                        "assessment_time": "未提及",
                        "assessment_conclusion": "未提及"
                    })
                },
                "assessment_agency": agency
            }
        }
        json_path = f"{self.base_dir}/extracted_json/application_form_{case_id:03d}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        return json_data

    def generate_image_evidence_json(self, image_id):
        """生成图片证据JSON数据（带根键 image_evidence）"""
        # 基本字段，缺失使用 '未提及'
        capture_location = self.fake.address()
        extracted = "密码应用安全性评估申请表\n单位名称：示例单位\n系统名称：示例系统"
        image_data = {
            "image_id": f"IMG{image_id:03d}",
            "file_name": f"evidence_image_{image_id:03d}.png",
            "evidence_type": random.choice(["申请表照片", "系统架构图", "密码设备照片"]),
            "capture_date": self.fake.date_between(start_date='-60d', end_date='today').strftime('%Y-%m-%d'),
            "capture_location": capture_location or '未提及',
            "extracted_text": extracted or '未提及',
            "confidence_score": round(random.uniform(0.85, 0.99), 2),
            "related_documents": [f"application_form_{random.randint(1,5):03d}.docx"]
        }

        # 解析 extracted_text 中的单位与系统名称（优先）
        unit_name = '未提及'
        system_name = '未提及'
        if isinstance(image_data.get('extracted_text'), str):
            txt = image_data['extracted_text']
            if '单位名称：' in txt:
                try:
                    unit_name = txt.split('单位名称：', 1)[1].splitlines()[0].strip() or '未提及'
                except:
                    pass
            if '系统名称：' in txt:
                try:
                    system_name = txt.split('系统名称：', 1)[1].splitlines()[0].strip() or '未提及'
                except:
                    pass

        # 构造 application_form 结构并写入（替代原来的 image_evidence JSON）
        app_json = {
            "application_form": {
                "unit_information": {
                    "unit_name": unit_name,
                    "unit_address": '未提及',
                    "provincial_password_authority": '未提及',
                    "postal_code": '未提及'
                },
                "contact_information": {
                    "name": '未提及',
                    "department": '未提及',
                    "mobile_phone": '未提及',
                    "title_position": '未提及',
                    "office_phone": '未提及',
                    "email": '未提及'
                },
                "information_system": {
                    "system_name": system_name,
                    "is_critical_infrastructure": False,
                    "critical_infrastructure_status": {
                        "identified": False,
                        "governing_department": '未提及',
                        "unidentified": True
                    },
                    "classification_status": {
                        "has_classified": False,
                        "level": '未提及',
                        "filing_certificate_number": '未提及',
                        "is_consistent_with_tested": False,
                        "change_description": '未提及',
                        "not_classified": True,
                        "evaluation_basis": '未提及'
                    },
                    "cybersecurity_evaluation": {
                        "status": '未提及',
                        "evaluation_org_name": '未提及',
                        "evaluation_time": '未提及',
                        "evaluation_conclusion": '未提及'
                    },
                    "cryptography_assessment": {
                        "status": '未提及',
                        "assessment_org_name": '未提及',
                        "assessment_time": '未提及',
                        "assessment_conclusion": '未提及'
                    },
                    "cloud_platform_dependency": {
                        "has_dependency": False,
                        "platform_name": '未提及',
                        "platform_assessment_status": '未提及',
                        "assessment_org_name": '未提及',
                        "assessment_time": '未提及',
                        "assessment_conclusion": '未提及'
                    }
                },
                "assessment_agency": {
                    "agency_name": '未提及',
                    "agency_address": '未提及',
                    "postal_code": '未提及',
                    "contact_person": {
                        "name": '未提及',
                        "department": '未提及',
                        "mobile_phone": '未提及',
                        "title_position": '未提及',
                        "office_phone": '未提及',
                        "email": '未提及'
                    },
                    "document_metadata": {
                        "prepared_by": '未提及',
                        "preparation_date": '未提及',
                        "reviewed_by": '未提及',
                        "review_date": '未提及',
                        "approved_by": '未提及',
                        "approval_date": '未提及'
                    }
                }
            }
        }

        # 将 JSON 文件写为仅包含 application_form 根键（符合你的模板）
        json_path = f"{self.base_dir}/extracted_json/image_evidence_{image_id:03d}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(app_json, f, ensure_ascii=False, indent=2)

        # 返回图片元数据供图片生成使用（不影响写入的 JSON 结构）
        return image_data
    
    def generate_application_form_docx(self, case_id, json_data):
        """生成Word格式的申请表 - 优化中文显示"""
        doc = Document()
        
        # 设置中文字体
        try:
            from docx.oxml.ns import qn
            # 设置全局字体
            doc.styles['Normal'].font.name = '宋体'
            doc.styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
        except:
            pass
        
        # 标题
        title = doc.add_heading('密码应用安全性评估申请表', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # 单位信息
        doc.add_heading('一、单位信息', level=1)
        unit_info = json_data['application_form']['unit_information']
        
        unit_data = [
            ['单位全称', unit_info['unit_name']],
            ['单位地址', unit_info['unit_address']],
            ['所属省部密码管理部门', unit_info['provincial_password_authority']],
            ['邮政编码', unit_info['postal_code']]
        ]
        
        unit_table = doc.add_table(rows=4, cols=2)
        unit_table.style = 'Light Grid Accent 1'
        
        for i, (label, value) in enumerate(unit_data):
            cell_l = unit_table.cell(i, 0)
            cell_r = unit_table.cell(i, 1)
            cell_l.text = label
            cell_r.text = value
            try:
                from docx.oxml.ns import qn
                # 设置单元格中文字体
                for p in cell_l.paragraphs:
                    for run in p.runs:
                        run.font.name = '宋体'
                        r = run._element.rPr.rFonts
                        r.set(qn('w:eastAsia'), '宋体')
                for p in cell_r.paragraphs:
                    for run in p.runs:
                        run.font.name = '宋体'
                        r = run._element.rPr.rFonts
                        r.set(qn('w:eastAsia'), '宋体')
            except:
                pass
        
        # 联系人信息
        doc.add_heading('二、联系人信息', level=1)
        contact_info = json_data['application_form']['contact_information']
        
        contact_data = [
            ['姓名', contact_info['name']],
            ['所属部门', contact_info['department']],
            ['移动电话', contact_info['mobile_phone']],
            ['职务/职称', contact_info['title_position']],
            ['办公电话', contact_info['office_phone']],
            ['电子邮件', contact_info['email']]
        ]
        
        contact_table = doc.add_table(rows=6, cols=2)
        contact_table.style = 'Light Grid Accent 1'
        
        for i, (label, value) in enumerate(contact_data):
            cell_l = contact_table.cell(i, 0)
            cell_r = contact_table.cell(i, 1)
            cell_l.text = label
            cell_r.text = value
            try:
                from docx.oxml.ns import qn
                for p in cell_l.paragraphs:
                    for run in p.runs:
                        run.font.name = '宋体'
                        r = run._element.rPr.rFonts
                        r.set(qn('w:eastAsia'), '宋体')
                for p in cell_r.paragraphs:
                    for run in p.runs:
                        run.font.name = '宋体'
                        r = run._element.rPr.rFonts
                        r.set(qn('w:eastAsia'), '宋体')
            except:
                pass
        
        # 信息系统信息
        doc.add_heading('三、信息系统信息', level=1)
        system_info = json_data['application_form']['information_system']
        
        p1 = doc.add_paragraph(f'系统名称：{system_info["system_name"]}')
        p2 = doc.add_paragraph(f'是否为关键信息基础设施：{"是" if system_info["is_critical_infrastructure"] else "否"}')
        try:
            from docx.oxml.ns import qn
            for run in p1.runs:
                run.font.name = '宋体'
                run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
            for run in p2.runs:
                run.font.name = '宋体'
                run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
        except:
            pass
        
        if system_info['is_critical_infrastructure']:
            doc.add_paragraph(f'安全保护工作部门：{system_info["critical_infrastructure_status"]["governing_department"]}')
        
        # 保存文件
        file_path = f"{self.base_dir}/documents/application_forms/application_form_{case_id:03d}.docx"
        doc.save(file_path)
        return file_path
    
    def generate_application_form_pdf(self, case_id, json_data):
        """生成PDF格式的申请表 - 修复中文显示"""
        file_path = f"{self.base_dir}/documents/application_forms/application_form_{case_id:03d}.pdf"
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # 创建支持中文的样式
        if self.chinese_font_available:
            chinese_style = ParagraphStyle(
                'ChineseStyle',
                parent=styles['Normal'],
                fontName='ChineseFont',
                fontSize=10,
                leading=14,
            )
            title_style = ParagraphStyle(
                'ChineseTitle',
                parent=styles['Heading1'],
                fontName='ChineseFont',
                fontSize=16,
                spaceAfter=30,
                alignment=1
            )
            heading_style = ParagraphStyle(
                'ChineseHeading',
                parent=styles['Heading2'],
                fontName='ChineseFont',
                fontSize=12,
                spaceAfter=12,
            )
        else:
            # 如果没有中文字体，使用默认样式
            chinese_style = styles['Normal']
            title_style = styles['Heading1']
            heading_style = styles['Heading2']
        
        story = []
        
        # 标题
        title = Paragraph('密码应用安全性评估申请表', title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # 单位信息
        story.append(Paragraph('一、单位信息', heading_style))
        unit_info = json_data['application_form']['unit_information']
        unit_data = [
            ['单位全称', unit_info['unit_name']],
            ['单位地址', unit_info['unit_address']],
            ['所属省部密码管理部门', unit_info['provincial_password_authority']],
            ['邮政编码', unit_info['postal_code']]
        ]
        
        unit_table = Table(unit_data, colWidths=[100, 400])
        unit_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(unit_table)
        story.append(Spacer(1, 12))
        
        # 联系人信息
        story.append(Paragraph('二、联系人信息', heading_style))
        contact_info = json_data['application_form']['contact_information']
        contact_data = [
            ['姓名', contact_info['name']],
            ['所属部门', contact_info['department']],
            ['移动电话', contact_info['mobile_phone']],
            ['职务/职称', contact_info['title_position']],
            ['办公电话', contact_info['office_phone']],
            ['电子邮件', contact_info['email']]
        ]
        
        contact_table = Table(contact_data, colWidths=[100, 400])
        contact_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(contact_table)
        
        doc.build(story)
        return file_path
    
    def generate_detailed_pdf(self, case_id, json_data):
        """生成详细的PDF文档，类似您提供的示例"""
        file_path = f"{self.base_dir}/documents/application_forms/detailed_form_{case_id:03d}.pdf"
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # 创建样式
        if self.chinese_font_available:
            title_style = ParagraphStyle(
                'ChineseTitle',
                parent=styles['Heading1'],
                fontName='ChineseFont',
                fontSize=16,
                spaceAfter=30,
                alignment=1
            )
            heading_style = ParagraphStyle(
                'ChineseHeading',
                parent=styles['Heading2'],
                fontName='ChineseFont',
                fontSize=14,
                spaceAfter=12,
            )
            normal_style = ParagraphStyle(
                'ChineseNormal',
                parent=styles['Normal'],
                fontName='ChineseFont',
                fontSize=10,
                leading=14,
            )
        else:
            title_style = styles['Heading1']
            heading_style = styles['Heading2']
            normal_style = styles['Normal']
        
        story = []
        
        # 标题
        story.append(Paragraph('密码相关应用表单信息提取测试文档', title_style))
        story.append(Spacer(1, 20))
        
        # 一、单位基本信息
        story.append(Paragraph('一、单位基本信息', heading_style))
        unit_info = json_data['application_form']['unit_information']
        
        unit_text = f"""
        本次申请单位为{unit_info['unit_name']}，该单位是专注于城市数字化建设的高新技术企业，主要为政府部门提供政务数据管理、城市安防监控等数字化解决方案。
        
        单位详细地址：{unit_info['unit_address']}（大厦一层设有单位前台，入口位于街道东侧）。
        
        所属省部密码管理部门：{unit_info['provincial_password_authority']}（负责统筹本单位密码应用审核与监督工作）。
        
        邮政编码：{unit_info['postal_code']}（对应区域邮政投递范围）。
        """
        story.append(Paragraph(unit_text.replace('\n', '<br/>'), normal_style))
        story.append(Spacer(1, 12))
        
        # 二、联系人及联系方式
        story.append(Paragraph('二、联系人及联系方式', heading_style))
        contact_info = json_data['application_form']['contact_information']
        
        contact_text = f"""
        本次申请业务对接联系人：{contact_info['name']}。
        
        所属部门：{contact_info['department']}（该部门主要负责信息系统开发、维护及安全优化）。
        
        职务/职称：{contact_info['title_position']}（具备5年以上政务系统项目管理经验，持有PMP认证）。
        
        移动电话：{contact_info['mobile_phone']}（工作日9:00-18:00保持畅通，节假日可通过短信留言）。
        
        办公电话：{contact_info['office_phone']}（分机号：8015，转接至个人办公工位）。
        
        电子邮件：{contact_info['email']}（邮件主题需注明"密码应用申请-XX事项"，24小时内回复）。
        """
        story.append(Paragraph(contact_text.replace('\n', '<br/>'), normal_style))
        story.append(Spacer(1, 12))
        
        # 三、信息系统详情
        story.append(Paragraph('三、信息系统详情', heading_style))
        system_info = json_data['application_form']['information_system']
        
        system_text = f"""
        （一）系统基础信息
        
        系统名称：{system_info['system_name']}。
        
        系统功能：用于存储市级政务公开数据（含民生服务、公共事务等领域数据），支持政府部门间数据共享与公众查询服务。
        
        是否为关键信息基础设施：{"是" if system_info["is_critical_infrastructure"] else "否"}（经{system_info["critical_infrastructure_status"]["governing_department"]}认定，纳入关键信息基础设施保护目录）。
        
        关键信息基础设施状态：
        - 已认定：{"是" if system_info["critical_infrastructure_status"]["identified"] else "否"}
        - 所属安全保护工作部门：{system_info["critical_infrastructure_status"]["governing_department"]}
        - 未认定：{"是" if system_info["critical_infrastructure_status"]["unidentified"] else "否"}
        
        （二）等级保护情况
        
        定级备案状态：
        - 已定级备案：{"是" if system_info["classification_status"]["has_classified"] else "否"}
        - 等级：{system_info["classification_status"]["level"]}（依据《信息安全技术信息系统安全等级保护基本要求》GB/T 22239-2019评定）
        - 备案证明编号：{system_info["classification_status"]["filing_certificate_number"]}（由相关部门出具）
        - 本次被测系统与定级系统一致性：{"是" if system_info["classification_status"]["is_consistent_with_tested"] else "否"}
        - 变化情况说明：{system_info["classification_status"]["change_description"] or "无变化"}
        - 未定级：{"是" if system_info["classification_status"]["not_classified"] else "否"}
        - 本次密评依据标准：{system_info["classification_status"]["evaluation_basis"]}
        """
        story.append(Paragraph(system_text.replace('\n', '<br/>'), normal_style))
        
        doc.build(story)
        return file_path
    
    def generate_evidence_image(self, image_id, json_data):
        """生成证据图片 - 使用简单方法避免字体问题"""
        try:
            # 创建图片
            img = Image.new('RGB', (1000, 1400), color='white')
            draw = ImageDraw.Draw(img)
            # 兼容根键：支持传入 {'image_evidence': {...}} 或 原始结构
            if isinstance(json_data, dict) and 'image_evidence' in json_data:
                data = json_data['image_evidence']
            else:
                data = json_data
            
            # 使用默认字体，避免中文问题
            try:
                # 尝试加载系统字体
                font_paths = [
                    '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
                    '/System/Library/Fonts/Arial Unicode.ttf',
                    'C:/Windows/Fonts/simhei.ttf',
                ]
                
                font = None
                title_font = None
                
                for path in font_paths:
                    if os.path.exists(path):
                        try:
                            font = ImageFont.truetype(path, 16)
                            title_font = ImageFont.truetype(path, 24)
                            break
                        except:
                            continue
                # 如果 setup_chinese_fonts 已设置了可用中文字体，优先使用它
                if (not font) and getattr(self, 'chinese_font_available', False) and getattr(self, 'chinese_font_path', None):
                    try:
                        font = ImageFont.truetype(self.chinese_font_path, 16)
                        title_font = ImageFont.truetype(self.chinese_font_path, 24)
                    except:
                        pass
                if font is None:
                    # 使用默认字体
                    font = ImageFont.load_default()
                    title_font = ImageFont.load_default()
                    
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
            
            # 绘制标题
            y_pos = 40
            try:
                draw.text((50, y_pos), "证据图片 - 密码应用相关文档", fill='black', font=title_font)
            except:
                draw.text((50, y_pos), "Evidence Image - Crypto Document", fill='black')
            y_pos += 60
            
            # 尝试从对应的 JSON 文件读取 application_form 数据用于渲染
            app_form = None
            json_path = f"{self.base_dir}/extracted_json/image_evidence_{image_id:03d}.json"
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as jf:
                        parsed = json.load(jf)
                        # 支持两种格式：直接是 application_form，或包含 application_form 根键
                        if isinstance(parsed, dict) and 'application_form' in parsed:
                            app_form = parsed['application_form']
                        elif isinstance(parsed, dict) and set(parsed.keys()) >= { 'unit_information' , 'contact_information' }:
                            app_form = parsed
                except:
                    app_form = None

            # 绘制基本信息框（如果有 application_form 就按模板显示，否则显示图片元信息）
            draw.rectangle([40, y_pos, 960, y_pos + 260], outline='black', width=2)
            y_pos += 10

            if app_form:
                # 单位信息
                unit = app_form.get('unit_information', {})
                draw.text((60, y_pos), f"单位全称: {unit.get('unit_name', '未提及')}", fill='black', font=font)
                y_pos += 26
                draw.text((60, y_pos), f"单位地址: {unit.get('unit_address', '未提及')}", fill='black', font=font)
                y_pos += 26
                draw.text((60, y_pos), f"所属部门: {unit.get('provincial_password_authority', '未提及')}", fill='black', font=font)
                y_pos += 26
                draw.text((60, y_pos), f"邮政编码: {unit.get('postal_code', '未提及')}", fill='black', font=font)
                y_pos += 30

                # 联系人
                contact = app_form.get('contact_information', {})
                draw.text((60, y_pos), f"联系人: {contact.get('name', '未提及')} ({contact.get('department', '未提及')})", fill='black', font=font)
                y_pos += 26
                draw.text((60, y_pos), f"移动电话: {contact.get('mobile_phone', '未提及')}  办公电话: {contact.get('office_phone', '未提及')}", fill='black', font=font)
                y_pos += 30

            else:
                capture_loc = data.get('capture_location', '')
                capture_location = capture_loc.splitlines()[0] if isinstance(capture_loc, str) and capture_loc else ''
                info_lines = [
                    f"文件编号: {data.get('image_id', '')}",
                    f"证据类型: {data.get('evidence_type', '')}",
                    f"采集日期: {data.get('capture_date', '')}",
                    f"采集地点: {capture_location}",
                    f"置信度: {data.get('confidence_score', '')}",
                ]
                for line in info_lines:
                    try:
                        draw.text((60, y_pos), line, fill='black', font=font)
                    except:
                        draw.text((60, y_pos), line, fill='black')
                    y_pos += 26
                y_pos += 10
            
            # 绘制文档内容区域
            draw.rectangle([40, y_pos, 960, 1300], outline='blue', width=2)
            draw.text((60, y_pos + 10), "模拟文档内容区域", fill='blue', font=title_font)
            y_text = y_pos + 40

            # 如果有 application_form，则渲染更多字段（信息系统、评估机构）
            if app_form:
                sys = app_form.get('information_system', {})
                draw.text((60, y_text), f"系统名称: {sys.get('system_name', '未提及')}", fill='black', font=font)
                y_text += 26
                draw.text((60, y_text), f"是否为关键信息基础设施: {'是' if sys.get('is_critical_infrastructure') else '否'}", fill='black', font=font)
                y_text += 26
                # 评估机构
                agency = app_form.get('assessment_agency', {})
                draw.text((60, y_text), f"评估机构: {agency.get('agency_name', '未提及')}", fill='black', font=font)
                y_text += 26
                # 文档元数据（若有）
                meta = agency.get('document_metadata', {})
                draw.text((60, y_text), f"编制: {meta.get('prepared_by', '未提及')}  审批: {meta.get('approved_by', '未提及')}", fill='black', font=font)
                y_text += 30
            else:
                # 显示提取文本
                extracted_text = data.get('extracted_text', '') if isinstance(data, dict) else ''
                lines = extracted_text.splitlines() if extracted_text else []
                for ln in lines:
                    for wrap in textwrap.wrap(ln, width=60):
                        draw.text((60, y_text), wrap, fill='black', font=font)
                        y_text += 22

            # 添加水印
            draw.text((400, 1350), "测试用途 - 密码学评测系统", fill='gray')
            
            # 添加水印
            draw.text((400, 1350), "测试用途 - 密码学评测系统", fill='gray')
            
            # 保存图片
            file_path = f"{self.base_dir}/documents/images/evidence_image_{image_id:03d}.png"
            img.save(file_path, 'PNG')
            return file_path
            
        except Exception as e:
            print(f"生成图片时出错: {e}")
            # 创建最简单的图片作为备选
            img = Image.new('RGB', (800, 600), color='white')
            draw = ImageDraw.Draw(img)
            draw.rectangle([10, 10, 790, 590], outline='black', width=2)
            draw.text((50, 50), f"Evidence {image_id:03d}", fill='black')
            file_path = f"{self.base_dir}/documents/images/evidence_image_{image_id:03d}.png"
            img.save(file_path)
            return file_path
    
    def generate_realistic_pdf_document(self, doc_id):
        """生成真实的PDF测试文档，类似您提供的示例"""
        file_path = f"{self.base_dir}/documents/application_forms/realistic_doc_{doc_id:03d}.pdf"
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # 创建样式
        if self.chinese_font_available:
            title_style = ParagraphStyle(
                'ChineseTitle',
                parent=styles['Heading1'],
                fontName='ChineseFont',
                fontSize=16,
                spaceAfter=30,
                alignment=1
            )
            heading_style = ParagraphStyle(
                'ChineseHeading',
                parent=styles['Heading2'],
                fontName='ChineseFont',
                fontSize=14,
                spaceAfter=12,
            )
            normal_style = ParagraphStyle(
                'ChineseNormal',
                parent=styles['Normal'],
                fontName='ChineseFont',
                fontSize=10,
                leading=14,
            )
        else:
            title_style = styles['Heading1']
            heading_style = styles['Heading2']
            normal_style = styles['Normal']
        
        story = []
        
        # 第一页
        story.append(Paragraph('密码相关应用表单信息提取测试文档', title_style))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph('一、单位基本信息', heading_style))
        unit_text = """
        本次申请单位为北京智慧城市科技发展有限公司，该单位是专注于城市数字化建设的高新技术企业，主要为政府部门提供政务数据管理、城市安防监控等数字化解决方案。

        单位详细地址：北京市海淀区中关村南大街 5 号智慧大厦 15 层（大厦一层设有单位前台，入口位于街道东侧）。

        所属省部密码管理部门：北京市密码管理局（负责统筹本单位密码应用审核与监督工作）。

        邮政编码：100081（对应海淀区中关村南大街区域邮政投递范围）。
        """
        story.append(Paragraph(unit_text.replace('\n', '<br/>'), normal_style))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph('二、联系人及联系方式', heading_style))
        contact_text = """
        本次申请业务对接联系人：张明。

        所属部门：技术研发部（该部门主要负责信息系统开发、维护及安全优化）。

        职务/职称：高级项目经理（具备5年以上政务系统项目管理经验，持有PMP认证）。

        移动电话：13811112222（工作日9:00-18:00保持畅通，节假日可通过短信留言）。

        办公电话：010-88887777（分机号：8015，转接至个人办公工位）。

        电子邮件：zhangming@bjcitytech.com（邮件主题需注明"密码应用申请-XX事项"，24小时内回复）。
        """
        story.append(Paragraph(contact_text.replace('\n', '<br/>'), normal_style))
        
        # 第二页
        story.append(PageBreak())
        story.append(Paragraph('三、信息系统详情', heading_style))
        story.append(Paragraph('（一）系统基础信息', normal_style))
        
        system_text = """
        系统名称：智慧城市政务数据管理系统。

        系统功能：用于存储市级政务公开数据（含民生服务、公共事务等领域数据），支持政府部门间数据共享与公众查询服务。

        是否为关键信息基础设施：是（经北京市政务服务管理局2023年12月认定，纳入关键信息基础设施保护目录）。

        关键信息基础设施状态：
        - 已认定：是
        - 所属安全保护工作部门：北京市政务服务管理局
        - 未认定：否
        """
        story.append(Paragraph(system_text.replace('\n', '<br/>'), normal_style))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph('（二）等级保护情况', normal_style))
        level_text = """
        定级备案状态：
        - 已定级备案：是
        - 等级：第三级（依据《信息安全技术信息系统安全等级保护基本要求》GB/T 22239-2019评定）
        - 备案证明编号：110108-GA2024-0056（由北京市公安局海淀分局出具，备案日期2024年1月）
        - 本次被测系统与定级系统一致性：是（系统功能、架构、数据范围无变化，仅优化部分接口性能）
        - 变化情况说明：无变化
        - 未定级：否
        - 本次密评依据标准：《信息安全技术信息系统密码应用基本要求》（GB/T 39786-2021）
        """
        story.append(Paragraph(level_text.replace('\n', '<br/>'), normal_style))
        
        doc.build(story)
        return file_path

    # 其他方法保持不变（generate_unit_info, generate_contact_info, generate_system_info等）
    # 这里省略了其他方法的重复代码，您可以使用之前版本中的这些方法

    def generate_all_test_data(self):
        """生成所有测试数据"""
        print("开始生成中文测试数据集...")
        
        # 生成真实的PDF测试文档
        print("生成真实PDF测试文档...")
        for i in range(1, 6):
            self.generate_realistic_pdf_document(i)
            # 为该示例 PDF 生成对应的 JSON 文件
            try:
                self.generate_realistic_pdf_json(i)
                print(f"  生成真实PDF文档和JSON {i:03d}")
            except Exception:
                print(f"  生成真实PDF文档 {i:03d}")
        
        # 生成图片证据
        print("生成图片证据...")
        for i in range(1, 13):
            json_data = self.generate_image_evidence_json(i)
            self.generate_evidence_image(i, json_data)
            print(f"  生成图片证据 {i:03d}.png")
        
        # 生成对应的JSON文件
        print("生成JSON文件...")
        for i in range(1, 6):
            json_data = self.generate_application_form_json(i, "normal")
            # 同时生成 DOCX 文档（与 JSON 保持一致）
            try:
                self.generate_application_form_docx(i, json_data)
                print(f"  生成JSON文件和DOCX {i:03d}")
            except Exception:
                # 回退：只输出 JSON
                print(f"  生成JSON文件 {i:03d}")
        
        print(f"\n中文测试数据集生成完成！保存在 {self.base_dir} 目录")
        self.print_summary()

    def print_summary(self):
        app_forms_dir = f"{self.base_dir}/documents/application_forms"
        site_records_dir = f"{self.base_dir}/documents/site_records"
        images_dir = f"{self.base_dir}/documents/images"
        json_dir = f"{self.base_dir}/extracted_json"

        docx_files = len([f for f in os.listdir(app_forms_dir) if f.endswith('.docx')]) if os.path.exists(app_forms_dir) else 0
        pdf_files = len([f for f in os.listdir(app_forms_dir) if f.endswith('.pdf')]) if os.path.exists(app_forms_dir) else 0
        site_docx = len([f for f in os.listdir(site_records_dir) if f.endswith('.docx')]) if os.path.exists(site_records_dir) else 0
        site_pdf = len([f for f in os.listdir(site_records_dir) if f.endswith('.pdf')]) if os.path.exists(site_records_dir) else 0
        images = len([f for f in os.listdir(images_dir) if f.endswith('.png')]) if os.path.exists(images_dir) else 0
        json_files = len([f for f in os.listdir(json_dir) if f.endswith('.json')]) if os.path.exists(json_dir) else 0

        print("\n" + "="*60)
        print("中文测试数据集生成摘要")
        print("="*60)

    def generate_realistic_pdf_json(self, doc_id):
        """为 realistic_doc_{doc_id} 生成与 application_form 相同结构的 JSON（带根键）"""
        # 使用示例化字段，缺失填 '未提及'
        json_data = {
            "application_form": {
                "unit_information": {
                    "unit_name": "北京智慧城市科技发展有限公司",
                    "unit_address": "北京市海淀区中关村南大街 5 号智慧大厦 15 层",
                    "provincial_password_authority": "北京市密码管理局",
                    "postal_code": "100081"
                },
                "contact_information": {
                    "name": "张明",
                    "department": "技术研发部",
                    "mobile_phone": "13811112222",
                    "title_position": "高级项目经理",
                    "office_phone": "010-88887777",
                    "email": "zhangming@bjcitytech.com"
                },
                "information_system": {
                    "system_name": "智慧城市政务数据管理系统",
                    "is_critical_infrastructure": True,
                    "critical_infrastructure_status": {
                        "identified": True,
                        "governing_department": "北京市政务服务管理局",
                        "unidentified": False
                    },
                    "classification_status": {
                        "has_classified": True,
                        "level": "第三级",
                        "filing_certificate_number": "110108-GA2024-0056",
                        "is_consistent_with_tested": True,
                        "change_description": "无变化",
                        "not_classified": False,
                        "evaluation_basis": "《信息安全技术 信息系统安全等级保护基本要求》GB/T 22239-2019"
                    },
                    "cybersecurity_evaluation": {
                        "status": "已测评",
                        "evaluation_org_name": "北京国信安全测评中心",
                        "evaluation_time": "2024 年 3 月 10 日 - 3 月 15 日",
                        "evaluation_conclusion": "系统符合信息安全等级保护第三级要求，安全防护措施有效，无高危安全漏洞，可正常投入使用。"
                    },
                    "cryptography_assessment": {
                        "status": "正在评估",
                        "assessment_org_name": "国家密码管理局商用密码检测中心",
                        "assessment_time": "预计 2024 年 6 月完成",
                        "assessment_conclusion": "暂未出具（待复测完成后 5 个工作日内出具正式报告）"
                    },
                    "cloud_platform_dependency": {
                        "has_dependency": True,
                        "platform_name": "阿里云政务云北京节点",
                        "platform_assessment_status": "云平台已评估",
                        "assessment_org_name": "国家密码管理局商用密码检测中心",
                        "assessment_time": "2023 年 11 月 20 日",
                        "assessment_conclusion": "云平台密码应用符合《信息安全技术 云计算服务安全指南》及商用密码相关标准，可支撑三级及以下信息系统运行，密码算法使用合规，密钥管理机制安全。"
                    }
                },
                "assessment_agency": {
                    "agency_name": "国家密码管理局商用密码检测中心",
                    "agency_address": "北京市西城区复兴门内大街 2 号",
                    "postal_code": "100031",
                    "contact_person": {
                        "name": "李华",
                        "department": "检测评估部",
                        "mobile_phone": "13933334444",
                        "title_position": "高级工程师",
                        "office_phone": "010-66665555",
                        "email": "lihua@scctc.org.cn"
                    },
                    "document_metadata": {
                        "prepared_by": "王磊",
                        "preparation_date": "2024-04-15",
                        "reviewed_by": "赵刚",
                        "review_date": "2024-04-18",
                        "approved_by": "孙强",
                        "approval_date": "2024-04-20"
                    }
                }
            }
        }

        json_path = f"{self.base_dir}/extracted_json/application_form_realistic_doc_{doc_id:03d}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        return json_data
        print(f"申请表文档: Word格式: {docx_files}个, PDF格式: {pdf_files}个")
        print(f"现场核查记录: Word格式: {site_docx}个, PDF格式: {site_pdf}个")
        print(f"图片证据: {images}个")
        print(f"JSON文件: {json_files}个")
        print("="*60)

# 生成测试数据
if __name__ == "__main__":
    generator = ChineseTestDataGenerator()
    generator.generate_all_test_data()
