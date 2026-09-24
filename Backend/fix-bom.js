const fs = require('fs');

function fixBom(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed BOM for', filePath);
    }
}

fixBom('src/main/java/com/team4/sportscenter/modules/member/repositories/BookingRepository.java');
fixBom('src/main/java/com/team4/sportscenter/modules/member/services/MemberService.java');
fixBom('src/main/java/com/team4/sportscenter/modules/member/services/impl/MemberServiceImpl.java');
