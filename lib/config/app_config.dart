class AppConfig {
  static const String googlePlacesApiKey = 'AIzaSyDcAw5j9JR1kWYLosJMwi8dqMPLF0x3OBc';
  static const String apiBaseUrl = String.fromEnvironment('STAYQ_API_BASE_URL',
    defaultValue: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');
  static const String whatsappSupportNumber = '+91 9225270718';
  static const String whatsappSupportUrl = 'https://wa.me/919225270718?text=Hi%20Stay%20Q%20Support';
  static const String deepseekApiKey = String.fromEnvironment('DEEPSEEK_API_KEY',
      defaultValue: 'sk-fc32eea03eba47128edece46d949af8c');
  static const String deepseekBaseUrl = 'https://api.deepseek.com';
  static const String deepseekModel = 'deepseek-chat';
}

