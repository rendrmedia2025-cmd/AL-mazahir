#!/usr/bin/env node

/**
 * Asset Integration Validation Script
 * Validates that all images are properly integrated and accessible
 */

const fs = require('fs');
const path = require('path');

class AssetIntegrationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validatedImages = 0;
    this.brokenReferences = [];
  }

  async validateIntegration() {
    console.log('🔍 Validating asset integration...');
    
    // Check directory structure
    await this.validateDirectoryStructure();
    
    // Check image files exist
    await this.validateImageFiles();
    
    // Check metadata file
    await this.validateMetadataFile();
    
    // Check component integration
    await this.validateComponentIntegration();
    
    // Check products data
    await this.validateProductsData();
    
    // Generate validation report
    this.generateValidationReport();
  }

  async validateDirectoryStructure() {
    console.log('📁 Validating directory structure...');
    
    const requiredDirs = [
      'public/assets',
      'public/assets/safety-equipment',
      'public/assets/fire-safety',
      'public/assets/tools-machinery',
      'public/assets/construction-materials',
      'public/assets/industrial-supplies',
      'public/assets/rental-equipment'
    ];

    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        this.errors.push(`Missing required directory: ${dir}`);
      } else {
        console.log(`✅ ${dir}`);
      }
    });
  }

  async validateImageFiles() {
    console.log('🖼️ Validating image files...');
    
    const assetsDir = 'public/assets';
    const categories = ['safety-equipment', 'fire-safety', 'tools-machinery', 'construction-materials', 'industrial-supplies', 'rental-equipment'];
    
    categories.forEach(category => {
      const categoryDir = path.join(assetsDir, category);
      
      if (fs.existsSync(categoryDir)) {
        const images = fs.readdirSync(categoryDir);
        
        if (images.length === 0) {
          this.warnings.push(`No images found in ${category} directory`);
        } else {
          images.forEach(image => {
            if (image.endsWith('.webp')) {
              this.validatedImages++;
              console.log(`✅ ${category}/${image}`);
            } else {
              this.warnings.push(`Non-WebP image found: ${category}/${image}`);
            }
          });
        }
      }
    });
  }

  async validateMetadataFile() {
    console.log('📋 Validating metadata file...');
    
    const metadataFile = 'src/lib/data/image-metadata.ts';
    
    if (!fs.existsSync(metadataFile)) {
      this.errors.push('Image metadata file not found');
      return;
    }

    try {
      const content = fs.readFileSync(metadataFile, 'utf8');
      
      // Check for required exports
      const requiredExports = ['imageMetadata', 'getImageMetadata', 'getImageAlt', 'getImageTitle'];
      requiredExports.forEach(exportName => {
        if (!content.includes(`export function ${exportName}`) && !content.includes(`export const ${exportName}`)) {
          this.errors.push(`Missing export: ${exportName} in metadata file`);
        }
      });
      
      console.log('✅ Image metadata file validated');
    } catch (error) {
      this.errors.push(`Error reading metadata file: ${error.message}`);
    }
  }

  async validateComponentIntegration() {
    console.log('🧩 Validating component integration...');
    
    const optimizedImageComponent = 'src/components/ui/OptimizedImage.tsx';
    
    if (!fs.existsSync(optimizedImageComponent)) {
      this.errors.push('OptimizedImage component not found');
      return;
    }

    try {
      const content = fs.readFileSync(optimizedImageComponent, 'utf8');
      
      // Check for required imports
      if (!content.includes('from \'@/lib/data/image-metadata\'')) {
        this.errors.push('OptimizedImage component missing metadata import');
      }
      
      // Check for required components
      const requiredComponents = ['OptimizedImage', 'ProductImage', 'CategoryImage'];
      requiredComponents.forEach(component => {
        if (!content.includes(`export function ${component}`)) {
          this.errors.push(`Missing component: ${component}`);
        }
      });
      
      console.log('✅ OptimizedImage component validated');
    } catch (error) {
      this.errors.push(`Error reading OptimizedImage component: ${error.message}`);
    }
  }

  async validateProductsData() {
    console.log('📦 Validating products data...');
    
    const productsFile = 'src/lib/data/products.ts';
    
    if (!fs.existsSync(productsFile)) {
      this.errors.push('Products data file not found');
      return;
    }

    try {
      const content = fs.readFileSync(productsFile, 'utf8');
      
      // Check for asset paths
      const assetReferences = content.match(/\/assets\/[^'"\s]+/g) || [];
      
      assetReferences.forEach(assetPath => {
        const fullPath = path.join('public', assetPath);
        if (!fs.existsSync(fullPath)) {
          this.brokenReferences.push(assetPath);
        }
      });
      
      // Check for old image references
      if (content.includes('/images/categories/') || content.includes('/images/products/')) {
        this.warnings.push('Products data still contains old image paths');
      }
      
      console.log(`✅ Products data validated (${assetReferences.length} asset references)`);
    } catch (error) {
      this.errors.push(`Error reading products data: ${error.message}`);
    }
  }

  generateValidationReport() {
    console.log('\n📊 ASSET INTEGRATION VALIDATION REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Images validated: ${this.validatedImages}`);
    console.log(`Errors found: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Broken references: ${this.brokenReferences.length}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS:`);
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (this.brokenReferences.length > 0) {
      console.log(`\n🔗 BROKEN REFERENCES:`);
      this.brokenReferences.forEach(ref => console.log(`  • ${ref}`));
    }
    
    if (this.errors.length === 0 && this.brokenReferences.length === 0) {
      console.log(`\n🎉 VALIDATION SUCCESSFUL!`);
      console.log(`✅ All assets properly integrated`);
      console.log(`✅ No broken references found`);
      console.log(`✅ Components updated successfully`);
      console.log(`✅ SEO and accessibility metadata in place`);
    } else {
      console.log(`\n❌ VALIDATION FAILED`);
      console.log(`Please fix the errors above before proceeding.`);
    }
    
    // Save validation report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        imagesValidated: this.validatedImages,
        errorsFound: this.errors.length,
        warnings: this.warnings.length,
        brokenReferences: this.brokenReferences.length
      },
      errors: this.errors,
      warnings: this.warnings,
      brokenReferences: this.brokenReferences,
      status: this.errors.length === 0 && this.brokenReferences.length === 0 ? 'PASSED' : 'FAILED'
    };
    
    fs.writeFileSync('asset-validation-report.json', JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed validation report saved to: asset-validation-report.json`);
  }
}

// Execute if called directly
if (require.main === module) {
  const validator = new AssetIntegrationValidator();
  validator.validateIntegration().catch(console.error);
}

module.exports = AssetIntegrationValidator;