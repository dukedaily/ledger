#!/usr/bin/env python3
"""
个人账本 - Personal Ledger
一个简单的个人财务管理工具

功能特点:
- 多钱包管理（现金、银行卡、信用卡、数字钱包、加密货币、投资账户）
- 多货币支持（USD、SGD、RMB）
- 支出分类管理（抚养费、赡养费、保险、税收、房租、按摩、娱乐、数码产品、旅游、节日礼物等）
- 收入分类管理（工资、投资收益、数字货币收益、保险理财等）
- 定期交易设置
- 预算管理
- 统计报表

使用方法:
    python main.py

作者: Personal Use
版本: 1.0.0
"""

import sys
import os

# 确保当前目录在路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_database
from cli import main_menu


def print_welcome():
    """打印欢迎信息"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              💰 个人账本 Personal Ledger 💰                  ║
║                                                              ║
║         支持货币: USD 🇺🇸 | SGD 🇸🇬 | RMB 🇨🇳              ║
║                                                              ║
║  功能: 钱包管理 | 收支记录 | 统计报表 | 预算管理            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)


def main():
    """主函数"""
    # 初始化数据库
    init_database()

    # 显示欢迎信息
    print_welcome()

    # 进入主菜单
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\n程序已退出。再见！")
        sys.exit(0)


if __name__ == "__main__":
    main()
