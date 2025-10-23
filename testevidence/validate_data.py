import json
import os

class DataValidator:
    def __init__(self, data_dir="test_dataset/extracted_json"):
        self.data_dir = data_dir
    
    def validate_json_structure(self, file_path):
        """验证JSON文件结构是否符合要求"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 检查必需字段
            required_fields = [
                "application_form.unit_information.unit_name",
                "application_form.unit_information.unit_address", 
                "application_form.contact_information.name",
                "application_form.information_system.system_name"
            ]
            
            for field in required_fields:
                keys = field.split('.')
                current = data
                for key in keys:
                    if key not in current:
                        return False, f"缺少必需字段: {field}"
                    current = current[key]
            
            return True, "结构验证通过"
            
        except Exception as e:
            return False, f"文件解析错误: {str(e)}"
    
    def validate_all_files(self):
        """验证所有JSON文件"""
        print("开始验证JSON文件结构...")
        
        json_files = [f for f in os.listdir(self.data_dir) if f.endswith('.json')]
        results = []
        
        for file in json_files:
            file_path = os.path.join(self.data_dir, file)
            is_valid, message = self.validate_json_structure(file_path)
            results.append({
                "file": file,
                "valid": is_valid,
                "message": message
            })
        
        # 统计结果
        valid_count = sum(1 for r in results if r['valid'])
        total_count = len(results)
        
        print(f"\n验证结果:")
        print(f"总文件数: {total_count}")
        print(f"有效文件: {valid_count}")
        print(f"无效文件: {total_count - valid_count}")
        print(f"通过率: {valid_count/total_count*100:.2f}%")
        
        # 显示无效文件详情
        invalid_files = [r for r in results if not r['valid']]
        if invalid_files:
            print("\n无效文件详情:")
            for file in invalid_files:
                print(f"  {file['file']}: {file['message']}")
        
        return results

# 运行验证
if __name__ == "__main__":
    validator = DataValidator()
    validator.validate_all_files()